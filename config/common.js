const UserDevice = require("../model/tbl_device_info");
const User = require("../model/tbl_user");
const { Op, where, Sequelize } = require("sequelize");
const jwt = require("jsonwebtoken");
const nodeMailer = require('nodemailer');
const randtoken = require('rand-token');
const sequelize = require("./database");


const common = {

    async checkUniqueEmail(req) {
        try {
            const { email, role } = req;
            let existingUser = null; // define outside to use later

            existingUser = await User.findOne({
                where: {
                    email: { [Op.eq]: email },
                    // role: { [Op.eq]: role.toUpperCase() },
                    status: { [Op.eq]: "Active" },
                },
            });

            return existingUser ? false : true; // false if exists, true if unique
        } catch (error) {
            console.error("checkUniqueEmail error:", error);
            return false;
        }
    },

    async checkUniqueMobile(req) {
        try {
            const { mobile_number, country_code, role } = req;
            let existingUser = null; // define once

            existingUser = await User.findOne({
                where: {
                    mobile_number: { [Op.eq]: mobile_number },
                    country_code: { [Op.eq]: country_code },
                    // role: { [Op.eq]: role.toUpperCase() },
                    status: { [Op.eq]: "Active" },
                },
            });

            return existingUser ? false : true; // false = already exists, true = unique
        } catch (error) {
            console.error("checkUniqueMobile error:", error);
            return false; // Assume duplicate on error
        }
    },

    async checkUniqueEmailEditProfile(req) {
        try {
            const { email, role, user_id } = req;
            let existingUser = null;

            const whereCondition = {
                email: { [Op.eq]: email },
                status: { [Op.eq]: "Active" },
                id: { [Op.ne]: user_id }
            };

            existingUser = await User.findOne({ where: whereCondition });

            return existingUser ? false : true;
        } catch (error) {
            console.error("checkUniqueEmail error:", error);
            return false;
        }
    },

    async checkUniqueMobileEditProfile(req) {
        try {
            const { mobile_number, country_code, role, user_id } = req;
            let existingUser = null;

            const whereCondition = {
                mobile_number: { [Op.eq]: mobile_number },
                country_code: { [Op.eq]: country_code },
                status: { [Op.eq]: "Active" },
                id: { [Op.ne]: user_id }
            };

            existingUser = await User.findOne({ where: whereCondition });

            return existingUser ? false : true;
        } catch (error) {
            console.error("checkUniqueMobile error:", error);
            return false;
        }
    },

    generateStrongPassword: function () {
        const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // First letter capital
        const lower = Math.random().toString(36).slice(2, 6);
        const digit = Math.floor(Math.random() * 10);
        const special = '!@#$%^&*()_+{}[]:;<>,.?'.charAt(Math.floor(Math.random() * 20));
        const rest = Math.random().toString(36).slice(2, 6);
        let password = upper + lower + digit + special + rest;
        // Shuffle password
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    },


    jwtToken: function (payload) {
        return new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7d' }, (err, token) => {
                if (err) return reject(err);
                resolve(token);
            });
        });
    },

    // jwtToken: function (payload) {
    //     return new Promise((resolve, reject) => {
    //         const options = {};

    //         // If NOT admin → set expiry
    //         if (payload.user_type !== 'ADMIN') {
    //             options.expiresIn = '7d';
    //         }

    //         jwt.sign(payload, process.env.JWT_SECRET_KEY, options, (err, token) => {
    //             if (err) return reject(err);
    //             resolve(token);
    //         });
    //     });
    // },

    checkUpdateDeviceInfo: async function (user_id, request, callback) {

        try {

            const upd_device = {
                user_id: user_id,
                // user_type: request.role.toUpperCase(),

                device_type: request.device_type,      // A=Android, I=iOS, W=Web
                device_token: request.device_token,

                uuid: request.uuid,
                os_version: request.os_version,
                app_version: request.app_version,

                device_name: request.device_name,
                model_name: request.model_name,

                ip: request.ip,
                timezone: request.timezone,
                latitude: request.latitude,
                longitude: request.longitude,

            };


            // Generate JWT token
            // const token = await common.jwtToken({ user_id: user_id, user_type: request.role.toUpperCase() });
            const token = await common.jwtToken({ user_id: user_id });
            upd_device.token = token;

            // Check if device info already exists
            // const device = await UserDevice.findOne({ where: { user_id: user_id, user_type: request.role.toUpperCase() } });
            const device = await UserDevice.findOne({ where: { user_id: user_id } });

            if (device) {
                // Update existing record
                // await UserDevice.update(upd_device, { where: { user_id: user_id, user_type: request.role.toUpperCase() } });
                await UserDevice.update(upd_device, { where: { user_id: user_id } });
            } else {
                // Insert new record
                await UserDevice.create(upd_device);
            }

            callback(token);

        } catch (err) {
            console.error("Error in checkUpdateDeviceInfo:", err);
            callback(null);
        }
    },

    async sendTemplateEmail(subject, to_email, message) {
        const transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true' || false,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Set up email data
        const mailOptions = {
            from: process.env.EMAIL_ID,
            to: to_email,
            subject: subject,
            html: message,
        };

        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error sending email:", error);
                    resolve(0); // Resolve the Promise with a value of 0 in case of an error.
                } else {
                    console.log("Email sent:", info.response);
                    resolve(1); // Resolve the Promise with a value of 1 for success.
                }
            });
        });
    },

    async generateRandomToken(length) {
        return randtoken.generate(length, "0123456789abcdefghijklnmopqrstuvwxyz");
    },

}

module.exports = common