module.exports = ({ cli }) => {
    return {
        resources: {
            lambdaRole: {
                deploy: {
                    component: "@webiny/serverless-aws-iam-role",
                    inputs: {
                        region: process.env.AWS_REGION,
                        service: "lambda.amazonaws.com",
                        policy: {
                            arn: "arn:aws:iam::aws:policy/AdministratorAccess"
                        }
                    }
                }
            },
            databaseProxy: {
                build: {
                    root: "./databaseProxy",
                    script: "yarn build"
                },
                deploy: {
                    component: "@webiny/serverless-function",
                    inputs: {
                        role: "${lambdaRole.arn}",
                        region: process.env.AWS_REGION,
                        description: "Handles interaction with MongoDB",
                        code: "./databaseProxy/build",
                        concurrencyLimit: 0, // No concurrency limit.
                        handler: "handler.handler",
                        memory: 512,
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
                    component: "@webiny/serverless-function",
                    inputs: {
                        role: "${lambdaRole.arn}",
                        description: "Webiny Site",
                        region: process.env.AWS_REGION,
                        memory: 128,
                        code: "./site/build",
                        handler: "handler.handler",
                        env: {
                            SSR_FUNCTION: "${siteSsr.arn}",
                            DB_PROXY_FUNCTION: "${databaseProxy.arn}"
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
                        role: "${lambdaRole.arn}",
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
                    component: "@webiny/serverless-function",
                    inputs: {
                        role: "${lambdaRole.arn}",
                        region: process.env.AWS_REGION,
                        description: "Webiny Admin",
                        code: "./admin/build",
                        handler: "handler.handler",
                        memory: 128
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
