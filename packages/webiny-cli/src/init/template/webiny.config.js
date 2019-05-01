module.exports = {
    functions: {
        "api": {
            method: "ALL",
            path: "/function/api",
            env: {
                MONGODB_SERVER: process.env.MONGODB_SERVER,
                MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
                WEBINY_JWT_SECRET: process.env.WEBINY_JWT_SECRET
            }
        }
    },
    apps: {
        "admin": {
            path: "/admin",
            env: {
                REACT_APP_API_HOST: process.env.REACT_APP_API_HOST
            }
        },
        "site": {
            path: "/",
            ssr: true,
            env: {
                REACT_APP_API_HOST: process.env.REACT_APP_API_HOST
            }
        }
    }
};
