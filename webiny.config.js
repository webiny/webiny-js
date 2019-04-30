module.exports = {
    functions: {
        "demo-api": {
            path: "/function/api",
            env: {
                MONGODB_SERVER: "mongodb://localhost:27018",
                MONGODB_DB_NAME: "webinyjs",
                WEBINY_JWT_SECRET: "MyS3cr3tK3Y"
            }
        }
    },
    apps: {
        "demo-admin": {
            path: "/admin",
            env: {
                REACT_APP_API_HOST: "http://localhost:9000"
            }
        },
        "demo-site": {
            path: "/",
            ssr: true,
            env: {
                REACT_APP_API_HOST: "http://localhost:9000"
            }
        }
    }
};
