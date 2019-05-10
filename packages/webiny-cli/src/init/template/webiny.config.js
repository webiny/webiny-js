module.exports = {
    functions: {
        api: {
            install: "src/install.js",
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
        admin: {
            path: "/admin",
            env: {
                PORT: 3001,
                REACT_APP_FUNCTIONS_HOST: process.env.REACT_APP_FUNCTIONS_HOST
            }
        },
        site: {
            path: "/",
            ssr: true,
            env: {
                PORT: 3002,
                REACT_APP_FUNCTIONS_HOST: process.env.REACT_APP_FUNCTIONS_HOST
            }
        }
    }
};
