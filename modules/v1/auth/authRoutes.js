const express = require('express');
const auth = require('./authController');

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs 
 */


authRouter.post('/signup', auth.createUser);

authRouter.post('/login', auth.login);

authRouter.post('/send-otp', auth.sendOTP);

authRouter.post('/verify-otp', auth.verifyOTP);


module.exports = authRouter;