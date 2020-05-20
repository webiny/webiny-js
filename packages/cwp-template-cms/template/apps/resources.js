module.exports = ({ cli }) => {
    return {
        resources: {
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
