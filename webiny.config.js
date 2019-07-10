module.exports = {
    functions: {
        "demo-gateway": {
            method: "ALL",
            path: "/function/gateway",
            env: {
                MONGODB_SERVER: process.env.MONGODB_SERVER,
                MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
                WEBINY_JWT_SECRET: process.env.WEBINY_JWT_SECRET
            }
        },
        "demo-service-page-builder": {
            method: "ALL",
            path: "/function/page-builder",
            env: {
                MONGODB_SERVER: process.env.MONGODB_SERVER,
                MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
                WEBINY_JWT_SECRET: process.env.WEBINY_JWT_SECRET
            }
        },
/*        "demo-service-headless": {
            method: "ALL",
            path: "/function/headless",
            env: {
                MONGODB_SERVER: process.env.MONGODB_SERVER,
                MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
                WEBINY_JWT_SECRET: process.env.WEBINY_JWT_SECRET
            }
        }*/
    },
    apps: {
        "demo-admin": {
            path: "/admin",
            env: {
                PORT: 3001,
                REACT_APP_FUNCTIONS_HOST: process.env.REACT_APP_FUNCTIONS_HOST
            }
        },
        "demo-site": {
            path: "/",
            ssr: true,
            env: {
                PORT: 3002,
                REACT_APP_FUNCTIONS_HOST: process.env.REACT_APP_FUNCTIONS_HOST
            }
        }
    }
};
