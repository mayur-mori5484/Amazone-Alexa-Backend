const Validator = require('validatorjs');
const CODES = require('../config/status_codes');
const { t } = require('localizify');
const en = require('../languages/en');
const ch = require('../languages/ch');
const { default: localizify } = require('localizify');
const CryptoJS = require('crypto-js');
const jwt = require("jsonwebtoken");
const UserDevice = require('../model/tbl_device_info');

const key = CryptoJS.enc.Utf8.parse(process.env.KEY);
const iv = CryptoJS.enc.Utf8.parse(process.env.IV);

const bypassMethods = ['signup', 'login', 'forgot-password', 'reset-password', 'send-otp', 'verify-otp'];

const bypassHeaderKey = [];




const validator = {


    extractHeaderLanguage: function (req, res, callback) {
        var headerlang = (req.headers['accept-language'] != undefined && req.headers['accept-language'] != '') ? req.headers['accept-language'] : 'en';
        req.lang = headerlang;
        req.language = (headerlang == 'en') ? en : ch;

        localizify
            .add('en', en)
            .add('ch', ch)
            .setLocale(headerlang);

        callback();

    },


    send_response: function (req, res, statuscode, code, message, data) {
        this.getMessage(req.lang, message, function (translated_message) {

            let response_data = {
                code: code,
                message: translated_message,
                data: data
            }


            res.status(statuscode);
            res.send(response_data);

            // validator.encryption(response_data, (response) => {
            //     res.status(statuscode);
            //     res.send(response);
            // })

        })
    },



    getMessage: function (language, message, callback) {
        let translated = t(message.keyword, language);

        if (message.content) {
            for (const key in message.content) {
                translated = translated.replace(`:${key}`, message.content[key]);
            }
        }

        callback(translated);
    },



    validateApiKey: async (req, res, next) => {
        try {
            // Split path safely: "/cms/getCmsLink" → ["cms", "getCmsLink"]
            const pathData = req.path.split('/').filter(Boolean);

            // Get last segment (safe for any route depth)
            const key = pathData[pathData.length - 1];


            // If key is allowed to bypass, skip auth
            if (bypassHeaderKey.includes(key)) {
                return next();
            }

            // Read api_key header
            const api_key = req.headers["api_key"] || "";

            if (!api_key) {
                return validator.send_response(
                    req,
                    res,
                    CODES.UNAUTHORIZED,
                    CODES.INVALID_API_KEY_TOKEN,
                    { keyword: 'rest_keywords_apikey_not_found', content: {} },
                    {}
                );
            }

            // Validate / decrypt
            let dec_api_key;
            try {
                dec_api_key = validator.decryptApiKey(api_key);
            } catch (err) {
                return validator.send_response(
                    req,
                    res,
                    CODES.UNAUTHORIZED,
                    CODES.INVALID_API_KEY_TOKEN,
                    { keyword: 'rest_keywords_invalid_api_key', content: {} },
                    {}
                );
            }

            // Check API key matches expected
            if (dec_api_key && dec_api_key === process.env.API_KEY) {
                return next(); // valid!
            }

            // Invalid API key
            return validator.send_response(
                req,
                res,
                CODES.UNAUTHORIZED,
                CODES.INVALID_API_KEY_TOKEN,
                { keyword: 'rest_keywords_invalid_api_key', content: {} },
                {}
            );

        } catch (error) {
            return validator.send_response(
                req,
                res,
                CODES.UNAUTHORIZED,
                CODES.INVALID_API_KEY_TOKEN,
                { keyword: 'rest_keywords_apikey_not_found', content: {} },
                {}
            );
        }
    },

    acceptCurrencyMiddleware: async (req, res, next) => {
        const currency = req.headers['accept-currency'];

        if (!currency) {
            // If header is missing, respond with an error
            return validator.send_response(req, res, CODES.SUCCESS, CODES.INVALID_API_KEY_TOKEN, { keyword: 'rest_keywords_currency_not_found', content: {} }, {});

        }

        // If the header is present, pass the request to the next middleware or route handler
        req.currency = currency; // Optionally, you can attach the currency value to the request object
        next();
    },



    validateHeaderToken: async (req, res, next) => {
        try {
            const headerToken = req.headers['authorization'] || "";
            // console.log('headerToken: ', headerToken);

            const pathData = req.path.split("/");
            // console.log('pathData: ', pathData);

            if (bypassMethods.indexOf(pathData[4]) === -1) {
                if (!headerToken) {
                    return validator.send_response(req, res, CODES.UNAUTHORIZED, CODES.INVALID_API_KEY_TOKEN, { keyword: 'rest_keywords_token_not_found', content: {} }, {});
                }

                jwt.verify(headerToken, process.env.JWT_SECRET_KEY, async (err, user) => {
                    if (err || !user) {
                        return validator.send_response(req, res, CODES.UNAUTHORIZED, CODES.INVALID_API_KEY_TOKEN, { keyword: 'invalid_or_expired_token', content: {} }, {});
                    }

                    const device = await UserDevice.findOne({
                        where: {
                            user_id: user.user_id,
                            user_type: user.user_type,
                            token: headerToken
                        }
                    });

                    if (!device) {
                        return validator.send_response(req, res, CODES.UNAUTHORIZED, CODES.INVALID_API_KEY_TOKEN, { keyword: 'device_token_not_found_or_mismatch', content: {} }, {});
                    }

                    req.user_id = user.user_id;
                    req.role = user.user_type;
                    next();
                });


            } else {

                next(); // bypass route
            }
        } catch (error) {

            return validator.send_response(req, res, CODES.UNAUTHORIZED, CODES.INVALID_API_KEY_TOKEN, { keyword: 'unexpected_error', content: {} }, {});
        }
    },


    async checkValidationRules(data, rules, lang = 'en') {
        try {
            // Pick messages by language
            let messages = en;
            if (lang === 'ch') {
                messages = ch;
            }

            const v = new Validator(data, rules, messages);

            const validator = { status: true };

            if (v.fails()) {
                const errors = v.errors.all();
                validator.status = false;

                for (const key in errors) {
                    validator.error = errors[key][0]; // First error message
                    break;
                }
            }

            return validator;
        } catch (error) {

            return { status: false, error: 'Validation failed due to internal error.' };
        }
    },

    decryptionForChat(req, callback) {
        if (req != undefined && req.trim() != '') {
            const cleanedData = req.replace(/\\n/g, '').replace(/'/g, '');
            const decrypted = CryptoJS.AES.decrypt(cleanedData, key, {
                iv: iv,
            });

            const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);

            let decryptionSend;
            try {
                decryptionSend = JSON.parse(decryptedData);

            } catch (error) {
                decryptionSend = decryptedData;
            }

            callback(decryptionSend);
        } else {
            callback({});
        }
    },

    decryptApiKey: (encryptedKey) => {
        if (encryptedKey && typeof encryptedKey === 'string' && encryptedKey.trim() !== '') {
            const cleanedData = encryptedKey.replace(/\\n/g, '').replace(/'/g, '');
            const decrypted = CryptoJS.AES.decrypt(cleanedData, key, { iv: iv });
            return decrypted.toString(CryptoJS.enc.Utf8);
        }
        return "";
    },


    decryption(req, callback) {
        const encrypted = req.body;

        if (encrypted && typeof encrypted === 'object') {
            return callback(req);
        }

        if (encrypted && typeof encrypted === 'string' && encrypted.trim() !== '') {
            const cleanedData = encrypted.replace(/\\n/g, '').replace(/'/g, '');
            const decrypted = CryptoJS.AES.decrypt(cleanedData, key, { iv: iv });

            const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
            let decryptionSend;
            try {
                decryptionSend = JSON.parse(decryptedData);
            } catch (error) {
                // 
                // decryptionSend = {};
                decryptionSend = decryptedData;
            }

            // 🛠 Return the full `req` object with decrypted body
            callback({
                ...req,
                body: decryptionSend
            });
        } else {
            callback({
                ...req,
                body: {}
            });
        }
    },


    encryption(req, callback) {
        try {
            if (typeof req === 'object') {
                req = JSON.stringify(req);
            }

            const encrypted = CryptoJS.AES.encrypt(req, key, {
                iv: iv,
            }).toString();
            callback(encrypted);
        } catch (error) {
            callback({ req });
        }
    },



}



module.exports = validator