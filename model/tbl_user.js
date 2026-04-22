const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("tbl_user", {
    id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.BIGINT,
        autoIncrement: true
    },
    social_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    first_name: {
        type: DataTypes.STRING,
    },

    last_name: {
        type: DataTypes.STRING,
    },

    country_code: {
        type: DataTypes.STRING,
    },

    mobile_number: {
        type: DataTypes.STRING,
    },

    password: {
        type: DataTypes.STRING,
    },

    profile_image: {
        type: DataTypes.STRING,
    },

    username: {
        type: DataTypes.STRING,
        unique: true,
    },

    gender: {
        type: DataTypes.ENUM("male", "female"),
    },

    date_of_birth: {
        type: DataTypes.DATEONLY,
    },

    login_type: {
        type: DataTypes.ENUM("S", "G", "A"),
        defaultValue: "S",
        comment: "S-simple, A-Apple, G-google",
    },

    otp_code: {
        type: DataTypes.STRING,
    },

    otp_verification: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

    signup_verify: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

    login_status: {
        type: DataTypes.ENUM("online", "offline"),
    },

    last_login: {
        type: DataTypes.DATE,
    },

    is_forgot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },



    status: {
        type: DataTypes.ENUM("Active", "Inactive", "Deleted"),
        defaultValue: "Active",
    },

}, {

    freezeTableName: true,
    timestamps: true,

});



module.exports = User;
