module.exports = ({ cli }) => {
    return {
        resources: {
            dbProxy: {
                deploy: {
                    component: "@webiny/serverless-db-proxy",
                    inputs: {
                        testConnectionBeforeDeploy: true,
                        region: process.env.AWS_REGION,
                        concurrencyLimit: 15,
                        timeout: 30,
                        env: {
                            MONGODB_SERVER: process.env.MONGODB_SERVER,
                            MONGODB_NAME: process.env.MONGODB_NAME
                        }
                    }
                }
            },
            site: {
                build: {
                    root: "./site",
                    script: `yarn build:${cli.env}`
                },
                deploy: {
                    component: "@webiny/serverless-app",
                    inputs: {
                        description: "Webiny Site",
                        region: process.env.AWS_REGION,
                        memory: 128,
                        timeout: 30,
                        code: "./site/build",
                        env: {
                            SSR_FUNCTION: "${siteSsr.arn}",
                            DB_PROXY_FUNCTION: "${dbProxy.arn}"
                        }
                    }
                }
            },
            siteSsr: {
                build: {
                    root: "./site",
                    script: `yarn build:ssr:${cli.env}`
                },
                deploy: {
                    component: "@webiny/serverless-function",
                    inputs: {
                        description: "Site SSR",
                        region: process.env.AWS_REGION,
                        code: "./site/build-ssr",
                        handler: "handler.handler",
                        memory: 2048,
                        timeout: 60
                    }
                }
            },
            admin: {
                build: {
                    root: "./admin",
                    script: `yarn build:${cli.env}`
                },
                deploy: {
                    component: "@webiny/serverless-app",
                    inputs: {
                        region: process.env.AWS_REGION,
                        description: "Webiny Admin",
                        code: "./admin/build"
                    }
                }
            },
            api: {
                component: "@webiny/serverless-api-gateway",
                inputs: {
                    name: "Apps Gateway",
                    region: process.env.AWS_REGION,
                    description: "Serverless React Apps",
                    binaryMediaTypes: ["*/*"],
                    endpoints: [
                        {
                            path: "/admin/{key+}",
                            method: "ANY",
                            function: "${admin}"
                        },
                        {
                            path: "/admin",
                            method: "ANY",
                            function: "${admin}"
                        },
                        {
                            path: "/{key+}",
                            method: "ANY",
                            function: "${site}"
                        },
                        {
                            path: "/",
                            method: "ANY",
                            function: "${site}"
                        }
                    ]
                }
            },
            cdn: {
                component: "@webiny/serverless-aws-cloudfront",
                inputs: {
                    forwardIdViaHeaders: true,
                    defaults: {
                        ttl: 300,
                        allowedHttpMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        forward: {
                            queryString: true
                        }
                    },
                    origins: [
                        {
                            url: "${api.url}",
                            allowedHttpMethods: ["HEAD", "GET"]
                        }
                    ]
                }
            }
        }
    };
};
