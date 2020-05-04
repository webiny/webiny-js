const vars = {
    region: process.env.AWS_REGION,
    debug: "true",
    bucket: process.env.S3_BUCKET,
    handlerApolloServer: {
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        },
        debug: true
    },
    mongodb: {
        server: process.env.MONGODB_SERVER,
        name: process.env.MONGODB_NAME
    },
    security: {
        token: {
            expiresIn: 2592000,
            secret: process.env.JWT_SECRET
        },
        validateAccessTokenFunction: "${validateAccessToken.name}"
    }
};

const apolloServiceDefinitions = {
    APOLLO_SERVER_OPTIONS: vars.handlerApolloServer,
    DB_PROXY_OPTIONS: {
        functionArn: "${dbProxy.arn}"
    },
    SECURITY_OPTIONS: vars.security
};

module.exports = () => ({
    resources: {
        apolloGateway: {
            watch: ["./apolloGateway/build"],
            build: {
                root: "./apolloGateway",
                script: "yarn build",
                define: {
                    // Maybe we should upgrade lambda component to check file content hash?
                    HANDLER_APOLLO_GATEWAY_OPTIONS: {
                        ...vars.handlerApolloServer,
                        services: [
                            {
                                name: "security",
                                function: "${security.name}"
                            },
                            {
                                name: "i18n",
                                function: "${i18n.name}"
                            },
                            {
                                name: "files",
                                function: "${filesGraphQL.name}"
                            },
                            {
                                name: "pageBuilder",
                                function: "${pageBuilder.name}"
                            },
                            {
                                name: "formBuilder",
                                function: "${formBuilder.name}"
                            },
                            {
                                name: "headlessCms",
                                function: "${headlessCms.name}"
                            }
                        ]
                    }
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "Apollo Gateway",
                    code: "./apolloGateway/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
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
        cognito: {
            deploy: {
                component: "@webiny/serverless-aws-cognito-user-pool",
                inputs: {
                    region: vars.region,
                    appClients: [
                        {
                            name: "ReactApp"
                        }
                    ]
                }
            }
        },
        security: {
            watch: ["./security/graphql/build"],
            build: {
                root: "./security/graphql",
                script: "yarn build",
                define: {
                    ...apolloServiceDefinitions,
                    COGNITO_OPTIONS: {
                        region: vars.region,
                        userPoolId: "${cognito.userPool.Id}"
                    }
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Security GraphQL API",
                    region: vars.region,
                    code: "./security/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        validateAccessToken: {
            watch: ["./security/validateAccessToken/build"],
            build: {
                root: "./security/validateAccessToken",
                script: "yarn build",
                define: {
                    DB_PROXY_OPTIONS: apolloServiceDefinitions.DB_PROXY_OPTIONS
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    code: "./security/validateAccessToken/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        filesDownload: {
            watch: ["./files/download/build"],
            build: {
                root: "./files/download",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Serves previously uploaded files.",
                    region: vars.region,
                    code: "./files/download/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 10,
                    env: {
                        S3_BUCKET: vars.bucket,
                        IMAGE_TRANSFORMER_FUNCTION: "${imageTransformer.arn}"
                    }
                }
            }
        },
        imageTransformer: {
            watch: ["./files/transform/build"],
            build: {
                root: "./files/transform",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Performs image optimization, resizing, etc.",
                    region: vars.region,
                    code: "./files/transform/build",
                    handler: "handler.handler",
                    memory: 1600,
                    timeout: 30,
                    env: {
                        S3_BUCKET: vars.bucket
                    }
                }
            }
        },
        filesManage: {
            watch: ["./files/manage/build"],
            build: {
                root: "./files/manage",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Triggered when a file is deleted.",
                    region: vars.region,
                    code: "./files/manage/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 10,
                    permissions: [
                        {
                            Action: "lambda:InvokeFunction",
                            Principal: "s3.amazonaws.com",
                            StatementId: "s3invoke",
                            SourceArn: `arn:aws:s3:::${vars.bucket}`
                        }
                    ],
                    env: {
                        S3_BUCKET: vars.bucket
                    }
                }
            }
        },
        filesBucket: {
            deploy: {
                component: "@webiny/serverless-aws-s3",
                inputs: {
                    deleteBucketOnRemove: false,
                    region: vars.region,
                    name: vars.bucket,
                    storage: {
                        accelerated: false
                    },
                    cors: {
                        CORSRules: [
                            {
                                AllowedHeaders: ["*"],
                                AllowedMethods: ["POST", "GET"],
                                AllowedOrigins: ["*"],
                                MaxAgeSeconds: 3000
                            }
                        ]
                    },
                    notificationConfiguration: {
                        LambdaFunctionConfigurations: [
                            {
                                LambdaFunctionArn: "${filesManage.arn}",
                                Events: ["s3:ObjectRemoved:*"]
                            }
                        ]
                    }
                }
            }
        },
        filesGraphQL: {
            watch: ["./files/graphql/build"],
            build: {
                root: "./files/graphql",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "Files GraphQL API",
                    code: "./files/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        DEBUG: vars.debug,
                        S3_BUCKET: vars.bucket,
                        UPLOAD_MIN_FILE_SIZE: "0",
                        UPLOAD_MAX_FILE_SIZE: "26214400"
                    }
                }
            }
        },
        i18n: {
            watch: ["./i18n/build"],
            build: {
                root: "./i18n",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    code: "./i18n/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        pageBuilderInstallation: {
            deploy: {
                component: "@webiny/serverless-aws-s3-object",
                inputs: {
                    region: vars.region,
                    bucket: "${filesBucket.name}",
                    deleteObjectOnRemove: true,
                    object: {
                        source: "@webiny/api-page-builder/installation",
                        key: "page-builder-installation.zip",
                        zip: true
                    }
                }
            }
        },
        pageBuilder: {
            watch: ["./pageBuilder/build"],
            build: {
                root: "./pageBuilder",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "Page Builder GraphQL API",
                    code: "./pageBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DEBUG: vars.debug,
                        INSTALLATION_S3_BUCKET: vars.bucket,
                        INSTALLATION_FILES_ZIP_KEY: "${pageBuilderInstallation.key}"
                    }
                }
            }
        },
        formBuilder: {
            watch: ["./formBuilder/build"],
            build: {
                root: "./formBuilder",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "Form Builder GraphQL API",
                    code: "./formBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        headlessCms: {
            watch: ["./headless/graphql/build"],
            build: {
                root: "./headless/graphql",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    code: "./headless/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        headlessCmsHandler: {
            watch: ["./headless/handler/build"],
            build: {
                root: "./headless/handler",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Headless CMS GraphQL API (handler)",
                    region: vars.region,
                    code: "./headless/handler/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        api: {
            component: "@webiny/serverless-api-gateway",
            inputs: {
                region: vars.region,
                description: "Main API Gateway",
                binaryMediaTypes: ["*/*"],
                endpoints: [
                    {
                        path: "/graphql",
                        method: "ANY",
                        function: "${apolloGateway.arn}"
                    },
                    {
                        path: "/files/{path}",
                        method: "ANY",
                        function: "${filesDownload.arn}"
                    },
                    {
                        path: "/cms/{key+}",
                        method: "ANY",
                        function: "${headlessCmsHandler.arn}"
                    }
                ]
            }
        },
        cdn: {
            component: "@webiny/serverless-aws-cloudfront",
            inputs: {
                origins: [
                    {
                        url: "${api.url}",
                        pathPatterns: {
                            "/graphql": {
                                ttl: 0,
                                forward: {
                                    headers: ["Accept", "Accept-Language"]
                                },
                                allowedHttpMethods: [
                                    "GET",
                                    "HEAD",
                                    "OPTIONS",
                                    "PUT",
                                    "POST",
                                    "PATCH",
                                    "DELETE"
                                ]
                            },
                            "/files/*": {
                                ttl: 2592000 // 1 month
                            },
                            "/cms*": {
                                ttl: 0,
                                forward: {
                                    headers: ["Accept", "Accept-Language"]
                                },
                                allowedHttpMethods: [
                                    "GET",
                                    "HEAD",
                                    "OPTIONS",
                                    "PUT",
                                    "POST",
                                    "PATCH",
                                    "DELETE"
                                ]
                            }
                        }
                    }
                ]
            }
        }
    }
});
