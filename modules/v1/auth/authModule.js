const CODES = require("../../../config/status_codes");
const middleware = require("../../../middleware/headerValidators");
const common = require("../../../config/common");
var md5 = require('md5');
const User = require("../../../model/tbl_user");
const moment = require('moment');
const { Sequelize, Op } = require("sequelize");



const authModule = {

    async signup(req, res) {

        try {

            const request = req.body;

            const uniqEmail = await common.checkUniqueEmail(request);
            const uniqMobile = await common.checkUniqueMobile(request);

            if (!uniqEmail) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_duplicate_email', content: {} }, {});
            }
            if (!uniqMobile) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_duplicate_phonenumber', content: {} }, {});
            }

            const insertData = {
                social_id: request.social_id,
                first_name: request.first_name,
                last_name: request.last_name,
                email: request.email,
                country_code: request.country_code,
                mobile_number: request.mobile_number,
                login_type: request.login_type?.toUpperCase(),
                password: md5(request.password),
            }

            const user = await User.create(insertData);

            if (user && user.id) {

                common.checkUpdateDeviceInfo(user.id, request, async (token) => {


                    if (!token) {
                        return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: "rest_keywords_device_info_error", content: {} }, {});
                    }
                    const responseData = {
                        id: Number(user.id),
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        mobile_number: user.mobile_number,
                        country_code: user.country_code,
                        token: token
                    };


                    const [updatedRows] = await User.update({ 'otp_code': 123456, 'otp_verification': 0 }, { where: { country_code: request.country_code, mobile_number: request.mobile_number } });

                    if (updatedRows === 0) {
                        // Means user not updated
                        return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_user_not_created', content: {} }, {}
                        );
                    }


                    return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_SUCCESS, { keyword: 'rest_keywords_user_add_success', content: {} }, responseData);

                })
            } else {

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_user_not_created', content: {} }, {});

            }


        } catch (error) {
            console.log('error: ', error);

            middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_ERROR, { keyword: 'rest_keywords_something_went_wrong', content: {} }, { error: error.message });



        }
    },

    async login(req, res) {

        try {

            const request = req.body;

            if (request.email) {

                const uniqEmail = await common.checkUniqueEmail(request);

                if (uniqEmail) {
                    return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_invalid_email', content: {} }, {});
                }

            }

            if (request.mobile_number && request.country_code) {

                const uniqMobile = await common.checkUniqueMobile(request);

                if (uniqMobile) {
                    return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_phone_number_missmatch', content: {} }, {});
                }
            }

            let whereCondition = {
                password: md5(request.password)
            };

            if (request.email) {
                whereCondition.email = request.email;
            } else {
                whereCondition.mobile_number = request.mobile_number;
                whereCondition.country_code = request.country_code;
            }

            const loggedUser = await User.findOne({
                where: whereCondition
            });

            if (!loggedUser) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_password_notvalid_message', content: {} }, {}
                );
            }

            if (loggedUser?.signup_verify === false) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_account_not_verified', content: {} }, {}
                );
            }

            if (loggedUser?.status == 'Inactive') {

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_user_inactive', content: {} }, {});

            }

            if (loggedUser?.status == 'Deleted') {

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_user_deleted', content: {} }, {});

            }



            common.checkUpdateDeviceInfo(loggedUser.id, request, async (token) => {


                if (!token) {
                    return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: "rest_keywords_device_info_error", content: {} }, {});
                }

                const responseData = {
                    id: Number(loggedUser?.id),
                    first_name: loggedUser?.first_name,
                    last_name: loggedUser?.last_name,
                    profile_image: loggedUser?.profile_image
                        ? process.env.S3_URL + loggedUser.profile_image
                        : '',
                    email: loggedUser?.email,
                    country_code: loggedUser?.country_code,
                    mobile_number: loggedUser?.mobile_number,
                    token: token,
                };

                await User.update({ 'last_login': new Date(), 'login_status': 'online' }, { where: { id: loggedUser.id } });

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_SUCCESS, { keyword: 'rest_keywords_login_success', content: {} }, responseData);

            })

        } catch (error) {
            console.log('error: ', error);
            middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_ERROR, { keyword: 'rest_keywords_something_went_wrong', content: {} }, { error: error.message });

        }

    },

    // this API for signup time send OTP
    async sendOTP(req, res) {

        try {

            const request = req.body;

            const uniqMobile = await common.checkUniqueMobile(request);

            if (!uniqMobile) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_duplicate_phonenumber', content: {} }, {});
            }

            const uniqEmail = await common.checkUniqueEmail(request);

            if (!uniqEmail) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_duplicate_email', content: {} }, {});
            }

            // send OTP third party integration can be done here

            return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_SUCCESS, { keyword: 'rest_keywords_otp_sent_successfully', content: {} }, {
                otp_code: 123456
            });

        } catch (error) {

            return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_ERROR, { keyword: 'rest_keywords_something_went_wrong', content: {} }, { error: error.message });

        }

    },

    async verifyOTP(req, res) {

        try {
            const request = req.body;

            const uniqMobile = await common.checkUniqueMobile(request);

            if (uniqMobile) {
                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_phone_number_missmatch', content: {} }, {});
            }

            const user = await User.findOne({
                where: {
                    country_code: request.country_code,
                    mobile_number: request.mobile_number,
                    otp_code: request.otp_code,
                    status: 'Active'
                }
            })

            if (user && user?.id) {

                await User.update({ 'signup_verify': 1, 'otp_code': null }, { where: { id: user.id } });

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_SUCCESS, { keyword: 'rest_keywords_otp_verified', content: {} }, {});

            } else {

                return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_NOT_FOUND, { keyword: 'rest_keywords_otp_invalid', content: {} }, {});
            }
        } catch (error) {

            return middleware.send_response(req, res, CODES.SUCCESS, CODES.RESPONSE_ERROR, { keyword: 'rest_keywords_something_went_wrong', content: {} }, { error: error.message });

        }
    },





}

module.exports = authModule;