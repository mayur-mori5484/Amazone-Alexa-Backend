const express = require('express');
const user = require('./userController');

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User APIs 
 */


module.exports = userRouter;