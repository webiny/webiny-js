const apolloServiceEnv = {
    COGNITO_REGION: process.env.AWS_REGION,
    COGNITO_USER_POOL_ID: "${cognito.userPool.Id}",
    DEBUG: "true",
    DB_PROXY_FUNCTION: "${databaseProxy.arn}",
    GRAPHQL_INTROSPECTION: process.env.GRAPHQL_INTROSPECTION,
    GRAPHQL_PLAYGROUND: process.env.GRAPHQL_PLAYGROUND,
    JWT_TOKEN_EXPIRES_IN: "2592000",
    JWT_TOKEN_SECRET: process.env.JWT_SECRET,
    VALIDATE_ACCESS_TOKEN_FUNCTION: "${securityValidateAccessToken.name}"
};
const apolloGatewayServices = {
    LAMBDA_SERVICE_SECURITY: "${securityGraphQL.name}",
    LAMBDA_SERVICE_I18N: "${i18nGraphQL.name}",
    LAMBDA_SERVICE_FILES: "${filesGraphQL.name}",
    LAMBDA_SERVICE_PAGE_BUILDER: "${pageBuilderGraphQL.name}",
    LAMBDA_SERVICE_FORM_BUILDER: "${formBuilderGraphQL.name}",
    LAMBDA_SERVICE_HEADLESS_CMS: "${headlessCmsGraphQL.name}"
};

module.exports = () => ({
    resources: {
        apolloGateway: {
            watch: ["./services/apolloGateway/build"],
            build: {
                root: "./services/apolloGateway",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "Apollo Gateway",
                    code: "./services/apolloGateway/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: { ...apolloServiceEnv, ...apolloGatewayServices }
                }
            }
        },
        databaseProxy: {
            build: {
                root: "./services/databaseProxy",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "Handles interaction with MongoDB",
                    code: "./services/databaseProxy/build",
                    concurrencyLimit: 15,
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        MONGODB_SERVER: process.env.MONGODB_SERVER,
                        MONGODB_NAME: process.env.MONGODB_NAME
                    }
                }
            }
        },
        cognito: {
            deploy: {
                component: "@webiny/serverless-aws-cognito-user-pool",
                inputs: {
                    region: process.env.AWS_REGION,
                    appClients: [
                        {
                            name: "ReactApp"
                        }
                    ]
                }
            }
        },
        securityGraphQL: {
            watch: ["./services/security/graphql/build"],
            build: {
                root: "./services/security/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Security GraphQL API",
                    region: process.env.AWS_REGION,
                    code: "./services/security/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: apolloServiceEnv
                }
            }
        },
        securityValidateAccessToken: {
            watch: ["./services/security/validateAccessToken/build"],
            build: {
                root: "./services/security/validateAccessToken",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    code: "./services/security/validateAccessToken/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        DB_PROXY_FUNCTION: "${databaseProxy.arn}",
                        DEBUG: process.env.DEBUG
                    }
                }
            }
        },
        filesDownload: {
            watch: ["./services/files/download/build"],
            build: {
                root: "./services/files/download",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Serves previously uploaded files.",
                    region: process.env.AWS_REGION,
                    code: "./services/files/download/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 10,
                    env: {
                        S3_BUCKET: process.env.S3_BUCKET,
                        IMAGE_TRANSFORMER_FUNCTION: "${imageTransformer.arn}"
                    }
                }
            }
        },
        imageTransformer: {
            watch: ["./services/files/transform/build"],
            build: {
                root: "./services/files/transform",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Performs image optimization, resizing, etc.",
                    region: process.env.AWS_REGION,
                    code: "./services/files/transform/build",
                    handler: "handler.handler",
                    memory: 1600,
                    timeout: 30,
                    env: {
                        S3_BUCKET: process.env.S3_BUCKET
                    }
                }
            }
        },
        filesManage: {
            watch: ["./services/files/manage/build"],
            build: {
                root: "./services/files/manage",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Triggered when a file is deleted.",
                    region: process.env.AWS_REGION,
                    code: "./services/files/manage/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 10,
                    permissions: [
                        {
                            Action: "lambda:InvokeFunction",
                            Principal: "s3.amazonaws.com",
                            StatementId: "s3invoke",
                            SourceArn: `arn:aws:s3:::${process.env.S3_BUCKET}`
                        }
                    ],
                    env: {
                        S3_BUCKET: process.env.S3_BUCKET
                    }
                }
            }
        },
        filesBucket: {
            deploy: {
                component: "@webiny/serverless-aws-s3",
                inputs: {
                    deleteBucketOnRemove: false,
                    region: process.env.AWS_REGION,
                    name: process.env.S3_BUCKET,
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
            watch: ["./services/files/graphql/build"],
            build: {
                root: "./services/files/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "Files GraphQL API",
                    code: "./services/files/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        ...apolloServiceEnv,
                        S3_BUCKET: process.env.S3_BUCKET,
                        UPLOAD_MIN_FILE_SIZE: "0",
                        UPLOAD_MAX_FILE_SIZE: "26214400"
                    }
                }
            }
        },
        i18nGraphQL: {
            watch: ["./services/i18n/graphql/build"],
            build: {
                root: "./services/i18n/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "I18N GraphQL API",
                    code: "./services/i18n/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: apolloServiceEnv
                }
            }
        },
        i18nLocales: {
            watch: ["./services/i18n/locales/build"],
            build: {
                root: "./services/i18n/locales",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    code: "./services/i18n/locales/build",
                    handler: "handler.handler",
                    memory: 256,
                    timeout: 30,
                    env: {
                        DB_PROXY_FUNCTION: "${databaseProxy.arn}",
                        DEBUG: process.env.DEBUG
                    }
                }
            }
        },
        pageBuilderInstallation: {
            deploy: {
                component: "@webiny/serverless-aws-s3-object",
                inputs: {
                    region: process.env.AWS_REGION,
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
        pageBuilderGraphQL: {
            watch: ["./services/pageBuilder/build"],
            build: {
                root: "./services/pageBuilder",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "Page Builder GraphQL API",
                    code: "./services/pageBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: {
                        ...apolloServiceEnv,
                        INSTALLATION_S3_BUCKET: process.env.S3_BUCKET,
                        INSTALLATION_FILES_ZIP_KEY: "${pageBuilderInstallation.key}"
                    }
                }
            }
        },
        formBuilderGraphQL: {
            watch: ["./services/formBuilder/build"],
            build: {
                root: "./services/formBuilder",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "Form Builder GraphQL API",
                    code: "./services/formBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 30,
                    env: { ...apolloServiceEnv, I18N_LOCALES_FUNCTION: "${i18nLocales.name}" }
                }
            }
        },
        headlessCmsGraphQL: {
            watch: ["./services/headless/graphql/build"],
            build: {
                root: "./services/headless/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: process.env.AWS_REGION,
                    description: "I18N GraphQL API",
                    code: "./services/headless/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: apolloServiceEnv
                }
            }
        },
        headlessCmsAPI: {
            watch: ["./services/headless/handler/build"],
            build: {
                root: "./services/headless/handler",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Headless CMS GraphQL API (handler)",
                    region: process.env.AWS_REGION,
                    code: "./services/headless/handler/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: { ...apolloServiceEnv, I18N_LOCALES_FUNCTION: "${i18nLocales.name}" }
                }
            }
        },
        api: {
            component: "@webiny/serverless-api-gateway",
            inputs: {
                region: process.env.AWS_REGION,
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
                        function: "${headlessCmsAPI.arn}"
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
