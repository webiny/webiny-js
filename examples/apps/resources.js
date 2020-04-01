const vars = {
    region: process.env.AWS_REGION,
    mongodb: {
        server: process.env.MONGODB_SERVER,
        name: process.env.MONGODB_NAME
    }
};

module.exports = ({ cli }) => {
    return {
        resources: {
            dbProxy: {
                deploy: {
                    component: "@webiny/serverless-db-proxy",
                    inputs: {
                        testConnectionBeforeDeploy: true,
                        region: vars.region,
                        concurrencyLimit: 15,
                        timeout: 30,
                        env: {
                            MONGODB_SERVER: vars.mongodb.server,
                            MONGODB_NAME: vars.mongodb.name
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
                        region: vars.region,
                        memory: 128,
                        timeout: 30,
                        code: "./site/build"
                    }
                }
            },
            siteSsrHandler: {
                build: {
                    root: "./site-ssr-handler",
                    script: `yarn build:${cli.env}`
                },
                deploy: {
                    component: "@webiny/serverless-function",
                    inputs: {
                        description: "Site Handler",
                        region: vars.region,
                        code: "./site-ssr-handler/build",
                        handler: "handler.handler",
                        memory: 512,
                        timeout: 60,
                        env: {
                            SSR_LAMBDA_ARN: "${siteSsr.arn}"
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
                        region: vars.region,
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
                        region: vars.region,
                        description: "Webiny Admin",
                        code: "./admin/build"
                    }
                }
            },
            api: {
                component: "@webiny/serverless-api-gateway",
                inputs: {
                    name: "Apps Gateway",
                    region: vars.region,
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
