module.exports = {
    uiPort: process.env.PORT || 1880,

    adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "ADMIN_PASSWORD_HASH",
            permissions: "*"
        }]
    },

    functionGlobalContext: {},

    logging: {
        console: {
            level: "info",
            audit: false
        }
    }
};
