
const validationRule = {

    signup: {
        first_name: "required|string",
        last_name: "required|string",
        email: "required|email",
        mobile_number: "required|numeric",
        country_code: "required",
        password: "required|string",
    },

    login: {
        password: "required|string",
    },

    forgotPassword: {

    },

    verifyOTP: {
        mobile_number: "required|numeric",
        country_code: "required",
        otp_code: "required",

    },

    resetPassword: {
        password: "required|string",
    },

    changePassword: {
        old_password: "required|string",
        new_password: "required|string",
    },

    sendOTP: {
        mobile_number: "required|numeric",
        country_code: "required",
    },
}

module.exports = validationRule;