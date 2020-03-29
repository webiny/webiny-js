const vars = {
    region: process.env.AWS_REGION,
    debug: "true",
    bucket: process.env.S3_BUCKET,
    httpHandlerApolloServer: {
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        },
        debug: true
    },
    apollo: {
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    },
    mongodb: {
        server: process.env.MONGODB_SERVER,
        name: process.env.MONGODB_NAME
    },
    security: {
        token: {
            expiresIn: 2592000,
            secret: process.env.JWT_SECRET
        }
    }
};

const apolloServiceDefinitions = {
    APOLLO_SERVER_OPTIONS: vars.httpHandlerApolloServer,
    DB_PROXY_OPTIONS: {
        functionArn: "${dbProxy.arn}"
    },
    SECURITY_OPTIONS: vars.security
};

module.exports = () => ({
    resources: {
        apolloGateway: {
            watch: ["./services/apolloGateway/build"],
            build: {
                root: "./services/apolloGateway",
                script: "yarn build",
                define: {
                    // TODO: changes in these parameters do not re-deploy lambda!!!
                    // Maybe we should upgrade lambda component to check file content hash?
                    HTTP_HANDLER_APOLLO_GATEWAY_OPTIONS: {
                        ...vars.httpHandlerApolloServer,
                        services: [
                            {
                                name: "security",
                                url: "${security.api.graphqlUrl}"
                            },
                            {
                                name: "i18n",
                                url: "${i18n.api.graphqlUrl}"
                            },
                            {
                                name: "files",
                                url: "${filesGraphQL.api.graphqlUrl}"
                            },
                            {
                                name: "pageBuilder",
                                url: "${pageBuilder.api.graphqlUrl}"
                            },
                            {
                                name: "formBuilder",
                                url: "${formBuilder.api.graphqlUrl}"
                            },
                            {
                                name: "headlessCms",
                                url: "${headlessCms.api.graphqlUrl}"
                            }
                        ]
                    }
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    region: vars.region,
                    code: "./services/apolloGateway/build",
                    handler: "handler.handler",
                    memory: 512,
                    timeout: 29,
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
            watch: ["./services/security/build"],
            build: {
                root: "./services/security",
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
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    function: {
                        code: "./services/security/build",
                        handler: "handler.handler",
                        memory: 512,
                        timeout: 30,
                        env: {
                            DEBUG: vars.debug
                        }
                    }
                }
            }
        },
        files: {
            deploy: {
                component: "@webiny/serverless-files",
                inputs: {
                    region: vars.region,
                    bucket: vars.bucket
                }
            }
        },
        filesGraphQL: {
            watch: ["./services/files/build"],
            build: {
                root: "./services/files",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    description: "Files GraphQL API",
                    binaryMediaTypes: ["*/*"],
                    endpoints: "${files.api.endpoints}",
                    function: {
                        code: "./services/files/build",
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
            }
        },
        i18n: {
            watch: ["./services/i18n/build"],
            build: {
                root: "./services/i18n",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    function: {
                        code: "./services/i18n/build",
                        handler: "handler.handler",
                        memory: 512,
                        env: {
                            DEBUG: vars.debug
                        }
                    }
                }
            }
        },
        pageBuilderInstallation: {
            deploy: {
                component: "@webiny/serverless-page-builder-installation",
                inputs: {
                    region: vars.region
                }
            }
        },
        pageBuilder: {
            watch: ["./services/pageBuilder/build"],
            build: {
                root: "./services/pageBuilder",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    function: {
                        code: "./services/pageBuilder/build",
                        handler: "handler.handler",
                        memory: 512,
                        timeout: 30,
                        env: {
                            DEBUG: vars.debug,
                            FILES_API_URL: "${filesGraphQL.api.graphqlUrl}",
                            INSTALLATION_S3_BUCKET: "${pageBuilderInstallation.bucketName}",
                            INSTALLATION_FILES_ZIP_KEY: "${pageBuilderInstallation.archiveKey}"
                        }
                    }
                }
            }
        },
        formBuilder: {
            watch: ["./services/formBuilder/build"],
            build: {
                root: "./services/formBuilder",
                script: "yarn build",
                define: {
                    ...apolloServiceDefinitions,
                    I18N_OPTIONS: {
                        graphqlUrl: "${i18n.api.graphqlUrl}"
                    }
                }
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    function: {
                        code: "./services/formBuilder/build",
                        handler: "handler.handler",
                        memory: 512,
                        timeout: 30,
                        env: {
                            DEBUG: vars.debug,
                            FILES_API_URL: "${filesGraphQL.api.graphqlUrl}"
                        }
                    }
                }
            }
        },
        headlessCms: {
            watch: ["./services/headlessCms/build"],
            build: {
                root: "./services/headlessCms",
                script: "yarn build",
                define: apolloServiceDefinitions
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    function: {
                        code: "./services/headlessCms/build",
                        handler: "handler.handler",
                        memory: 512,
                        env: {
                            DEBUG: vars.debug
                        }
                    }
                }
            }
        },
        headlessCmsHandler: {
            watch: ["./services/headlessCmsHandler/build"],
            build: {
                root: "./services/headlessCmsHandler",
                script: "yarn build",
                define: {
                    ...apolloServiceDefinitions,
                    I18N_OPTIONS: {
                        graphqlUrl: "${i18n.api.graphqlUrl}"
                    }
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Headless CMS GraphQL API (handler)",
                    region: vars.region,
                    code: "./services/headlessCmsHandler/build",
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
                endpoints: [
                    {
                        path: "/graphql",
                        method: "ANY",
                        function: "${apolloGateway}"
                    },
                    {
                        path: "/cms/{key+}",
                        method: "ANY",
                        function: "${headlessCmsHandler}"
                    }
                ]
            }
        },
        cdn: {
            component: "@webiny/serverless-aws-cloudfront",
            inputs: {
                origins: [
                    {
                        url: "${filesGraphQL.api.url}",
                        pathPatterns: {
                            "/files/*": {
                                ttl: 2592000 // 1 month
                            }
                        }
                    },
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
