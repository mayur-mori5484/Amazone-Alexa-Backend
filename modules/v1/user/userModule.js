const CODES = require("../../../config/status_codes");
const middleware = require("../../../middleware/headerValidators");
const common = require("../../../config/common");
var md5 = require('md5');
const User = require("../../../model/tbl_user");
const { Op, literal, Sequelize } = require("sequelize");
const sequelize = require("../../../config/database");

const userModule = {


}

module.exports = userModule;