const validationRule = require('../validation_rules');
const CODES = require("../../../config/status_codes");
const middleware = require("../../../middleware/headerValidators");
const authModule = require("./authModule");


const auth = {

    async createUser(req, res) {

        // middleware.decryption(req, async (request) => {

        const lang = req.headers['accept-language'] || 'en';

        const valid = await middleware.checkValidationRules(req.body, validationRule.signup, lang);

        if (valid.status) {
            return authModule.signup(req, res);
        } else {
            return middleware.send_response(req, res, CODES.ERROR, CODES.RESPONSE_NOT_FOUND, { keyword: valid.error, content: {} }, null)

        }
        // })
    },

    async login(req, res) {

        // middleware.decryption(req, async (request) => {

        const lang = req.headers['accept-language'] || 'en';

        const valid = await middleware.checkValidationRules(req.body, validationRule.login, lang);

        if (valid.status) {
            return authModule.login(req, res);
        } else {
            return middleware.send_response(req, res, CODES.ERROR, CODES.RESPONSE_NOT_FOUND, { keyword: valid.error, content: {} }, null)

        }
        // })
    },

    async sendOTP(req, res) {

        // middleware.decryption(req, async (request) => {

        const lang = req.headers['accept-language'] || 'en';

        const valid = await middleware.checkValidationRules(req.body, validationRule.sendOTP, lang);

        if (valid.status) {
            return authModule.sendOTP(req, res);
        } else {
            return middleware.send_response(req, res, CODES.ERROR, CODES.RESPONSE_NOT_FOUND, { keyword: valid.error, content: {} }, null)

        }
        // })
    },

    async verifyOTP(req, res) {

        // middleware.decryption(req, async (request) => {

        const lang = req.headers['accept-language'] || 'en';

        const valid = await middleware.checkValidationRules(req.body, validationRule.verifyOTP, lang);

        if (valid.status) {
            return authModule.verifyOTP(req, res);
        } else {
            return middleware.send_response(req, res, CODES.ERROR, CODES.RESPONSE_NOT_FOUND, { keyword: valid.error, content: {} }, null)

        }
        // })
    },

}

module.exports = auth;