const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./tbl_user");

const UserDevice = sequelize.define("tbl_device_info", {
    id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.BIGINT,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    token: {
        type: DataTypes.STRING(256),
        allowNull: true,
    },
    device_type: {
        type: DataTypes.ENUM("A", "I", "W"),
        allowNull: true,
    },
    device_token: {
        type: DataTypes.STRING(256),
        allowNull: true,
    },
    uuid: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    os_version: {
        type: DataTypes.STRING(32),
        allowNull: true,
    },
    app_version: {
        type: DataTypes.STRING(32),
        allowNull: true,
    },
    device_name: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    model_name: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    ip: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    timezone: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    latitude: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    longitude: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    language: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: true,

})


User.hasMany(UserDevice, {
    foreignKey: "user_id",
    constraints: false,
    as: "tbl_user_device_info",
});

UserDevice.belongsTo(User, {
    foreignKey: "user_id",
    constraints: false,
    as: "tbl_user_device_info",
});




module.exports = UserDevice;