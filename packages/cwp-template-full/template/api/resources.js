const { getLayerArn } = require("@webiny/aws-layers");

const apolloServiceEnv = {
    COGNITO_REGION: process.env.AWS_REGION,
    COGNITO_USER_POOL_ID: "${cognito.userPool.Id}",
    DEBUG: "true",
    DB_PROXY_FUNCTION: "${databaseProxy.arn}",
    GRAPHQL_INTROSPECTION: process.env.GRAPHQL_INTROSPECTION,
    GRAPHQL_PLAYGROUND: process.env.GRAPHQL_PLAYGROUND,
    JWT_TOKEN_EXPIRES_IN: "2592000",
    JWT_TOKEN_SECRET: process.env.JWT_SECRET,
    SETTINGS_MANAGER_FUNCTION: "${settingsManager.arn}",
    VALIDATE_ACCESS_TOKEN_FUNCTION: "${securityValidateAccessToken.name}"
};
const apolloGatewayServices = {
    LAMBDA_SERVICE_SECURITY: "${securityGraphQL.name}",
    LAMBDA_SERVICE_I18N: "${i18nGraphQL.name}",
    LAMBDA_SERVICE_FILES: "${filesGraphQL.name}",
    LAMBDA_SERVICE_PAGE_BUILDER: "${pageBuilderGraphQL.name}",
    LAMBDA_SERVICE_FORM_BUILDER: "${formBuilderGraphQL.name}",
    LAMBDA_SERVICE_HEADLESS_CMS: "${cmsGraphQL.name}"
};

module.exports = () => ({
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
        apolloGateway: {
            watch: ["./apolloGateway/build"],
            build: {
                root: "./apolloGateway",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "Apollo Gateway",
                    code: "./apolloGateway/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: { ...apolloServiceEnv, ...apolloGatewayServices }
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
        settingsManager: {
            watch: ["./settingsManager/build"],
            build: {
                root: "./settingsManager",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    description: "Settings Manager",
                    region: process.env.AWS_REGION,
                    code: "./settingsManager/build",
                    handler: "handler.handler",
                    memory: 128,
                    timeout: 20,
                    env: {
                        DB_PROXY_FUNCTION: "${databaseProxy.arn}",
                        DEBUG: process.env.DEBUG
                    }
                }
            }
        },
        securityGraphQL: {
            watch: ["./security/graphql/build"],
            build: {
                root: "./security/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    description: "Security GraphQL API",
                    region: process.env.AWS_REGION,
                    code: "./security/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: apolloServiceEnv
                }
            }
        },
        securityValidateAccessToken: {
            watch: ["./security/validateAccessToken/build"],
            build: {
                root: "./security/validateAccessToken",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    code: "./security/validateAccessToken/build",
                    handler: "handler.handler",
                    memory: 256,
                    env: {
                        DB_PROXY_FUNCTION: "${databaseProxy.arn}",
                        DEBUG: process.env.DEBUG
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
                    role: "${lambdaRole.arn}",
                    description: "Serves previously uploaded files.",
                    region: process.env.AWS_REGION,
                    code: "./files/download/build",
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
            watch: ["./files/transform/build"],
            build: {
                root: "./files/transform",
                script: `yarn build`
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    description: "Performs image optimization, resizing, etc.",
                    region: process.env.AWS_REGION,
                    code: "./files/transform/build",
                    handler: "handler.handler",
                    memory: 1600,
                    layers: [getLayerArn("webiny-v4-sharp", process.env.AWS_REGION)],
                    env: {
                        S3_BUCKET: process.env.S3_BUCKET
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
                    role: "${lambdaRole.arn}",
                    description: "Triggered when a file is deleted.",
                    region: process.env.AWS_REGION,
                    code: "./files/manage/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 10,
                    permissions: [
                        {
                            Action: "lambda:InvokeFunction",
                            Principal: "s3.amazonaws.com",
                            StatementId: process.env.S3_BUCKET,
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
                    accelerated: false,
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
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "Files GraphQL API",
                    code: "./files/graphql/build",
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
            watch: ["./i18n/graphql/build"],
            build: {
                root: "./i18n/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "I18N GraphQL API",
                    code: "./i18n/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: apolloServiceEnv
                }
            }
        },
        i18nLocales: {
            watch: ["./i18n/locales/build"],
            build: {
                root: "./i18n/locales",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    code: "./i18n/locales/build",
                    handler: "handler.handler",
                    memory: 256,
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
            watch: ["./pageBuilder/build"],
            build: {
                root: "./pageBuilder",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "Page Builder GraphQL API",
                    code: "./pageBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        ...apolloServiceEnv,
                        INSTALLATION_S3_BUCKET: process.env.S3_BUCKET,
                        INSTALLATION_FILES_ZIP_KEY: "${pageBuilderInstallation.key}"
                    }
                }
            }
        },
        formBuilderGraphQL: {
            watch: ["./formBuilder/build"],
            build: {
                root: "./formBuilder",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "Form Builder GraphQL API",
                    code: "./formBuilder/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        ...apolloServiceEnv,
                        I18N_LOCALES_FUNCTION: "${i18nLocales.name}"
                    }
                }
            }
        },
        cmsGraphQL: {
            watch: ["./cms/graphql/build"],
            build: {
                root: "./cms/graphql",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    region: process.env.AWS_REGION,
                    description: "CMS Admin GraphQL API",
                    code: "./cms/graphql/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        ...apolloServiceEnv,
                        CMS_DATA_MANAGER_FUNCTION: "${cmsDataManager.name}"
                    }
                }
            }
        },
        cmsContent: {
            watch: ["./cms/content/build"],
            build: {
                root: "./cms/content",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    description: "CMS Content API",
                    region: process.env.AWS_REGION,
                    code: "./cms/content/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        ...apolloServiceEnv,
                        I18N_LOCALES_FUNCTION: "${i18nLocales.name}",
                        CMS_DATA_MANAGER_FUNCTION: "${cmsDataManager.name}",
                        SETTINGS_MANAGER_FUNCTION: "${settingsManager.arn}"
                    }
                }
            }
        },
        cmsDataManager: {
            watch: ["./cms/dataManager/build"],
            build: {
                root: "./cms/dataManager",
                script: "yarn build"
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    role: "${lambdaRole.arn}",
                    description: "CMS Data Manager",
                    region: process.env.AWS_REGION,
                    code: "./cms/dataManager/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        MONGODB_SERVER: process.env.MONGODB_SERVER,
                        MONGODB_NAME: process.env.MONGODB_NAME,
                        I18N_LOCALES_FUNCTION: "${i18nLocales.name}"
                    }
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
                        function: "${cmsContent.arn}"
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
