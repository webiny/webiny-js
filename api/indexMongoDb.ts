import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { parse } from "url";
import * as path from "path";

// TODO: types fix
// @ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";
// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

// TODO: AdministratorAccess?
const defaultLambdaRole = new aws.iam.Role("default-lambda-role", {
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Principal: {
                    Service: "lambda.amazonaws.com"
                },
                Effect: "Allow"
            }
        ]
    }
});

new aws.iam.RolePolicyAttachment("default-lambda-role-policy", {
    role: defaultLambdaRole,
    policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
});

const defaults = {
    function: {
        runtime: "nodejs12.x",
        handler: "handler.handler",
        role: defaultLambdaRole.arn,
        timeout: 30,
        memorySize: 512
    }
};

// ------------------------------------------------------------------------------------------
//                                    Cognito User Pool
// ------------------------------------------------------------------------------------------
const cognito: { userPool: aws.cognito.UserPool; userPoolClient?: aws.cognito.UserPoolClient } = {
    userPool: new aws.cognito.UserPool("api-user-pool", {
        passwordPolicy: {
            minimumLength: 8,
            requireLowercase: false,
            requireNumbers: false,
            requireSymbols: false,
            requireUppercase: false,
            temporaryPasswordValidityDays: 7
        },
        adminCreateUserConfig: {
            allowAdminCreateUserOnly: true
        },
        autoVerifiedAttributes: ["email"],
        emailConfiguration: {
            emailSendingAccount: "COGNITO_DEFAULT"
        },
        mfaConfiguration: "OFF",
        userPoolAddOns: {
            advancedSecurityMode: "OFF" /* required */
        },
        usernameAttributes: ["email"],
        verificationMessageTemplate: {
            defaultEmailOption: "CONFIRM_WITH_CODE"
        },
        schemas: [
            {
                attributeDataType: "String",
                name: "email",
                required: true,
                developerOnlyAttribute: false,
                mutable: true,
                stringAttributeConstraints: {
                    maxLength: "2048",
                    minLength: "0"
                }
            },
            {
                attributeDataType: "String",
                name: "family_name",
                required: true,
                developerOnlyAttribute: false,
                mutable: true,
                stringAttributeConstraints: {
                    maxLength: "2048",
                    minLength: "0"
                }
            },
            {
                attributeDataType: "String",
                name: "given_name",
                required: true,
                developerOnlyAttribute: false,
                mutable: true,
                stringAttributeConstraints: {
                    maxLength: "2048",
                    minLength: "0"
                }
            }
        ]
    })
};
cognito.userPoolClient = new aws.cognito.UserPoolClient("user-client", {
    userPoolId: cognito.userPool.id
});

// ------------------------------------------------------------------------------------------
//                                      DB Proxy
// ------------------------------------------------------------------------------------------

const databaseProxy = new aws.lambda.Function("db-proxy", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/databaseProxy/build")
    }),
    environment: {
        variables: {
            MONGODB_SERVER: String(process.env.MONGODB_SERVER),
            MONGODB_NAME: String(process.env.MONGODB_NAME)
        }
    }
});

// ------------------------------------------------------------------------------------------
//                                   Settings Manager
// ------------------------------------------------------------------------------------------

const settingsManager = {
    getSettings: new aws.lambda.Function("sm-get-settings", {
        ...defaults.function,
        memorySize: 128,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/settingsManager/build")
        }),
        environment: {
            variables: { DB_PROXY_FUNCTION: databaseProxy.arn }
        }
    })
};

const security: { graphql?: aws.lambda.Function; validateAccessToken: aws.lambda.Function } = {
    validateAccessToken: new aws.lambda.Function("security-validate-access-token", {
        ...defaults.function,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/security/validateAccessToken/build")
        }),
        environment: {
            variables: { DB_PROXY_FUNCTION: databaseProxy.arn, DEBUG: String(process.env.DEBUG) }
        }
    })
};

const apolloServiceEnv = {
    COGNITO_REGION: String(process.env.AWS_REGION),
    COGNITO_USER_POOL_ID: cognito.userPool.id,
    DEBUG: String(process.env.DEBUG),
    DB_PROXY_FUNCTION: databaseProxy.arn,
    GRAPHQL_INTROSPECTION: String(process.env.GRAPHQL_INTROSPECTION),
    GRAPHQL_PLAYGROUND: String(process.env.GRAPHQL_PLAYGROUND),
    JWT_TOKEN_EXPIRES_IN: String(process.env.JWT_TOKEN_EXPIRES_IN),
    JWT_TOKEN_SECRET: String(process.env.JWT_TOKEN_EXPIRES_IN),
    SETTINGS_MANAGER_FUNCTION: settingsManager.getSettings.arn,
    VALIDATE_ACCESS_TOKEN_FUNCTION: security.validateAccessToken.arn
};

security.graphql = new aws.lambda.Function("security-graphql", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/security/graphql/build")
    }),
    environment: {
        variables: apolloServiceEnv
    }
});

// ------------------------------------------------------------------------------------------
//                                         I18N
// ------------------------------------------------------------------------------------------

const i18n = {
    graphql: new aws.lambda.Function("i18n-graphql", {
        ...defaults.function,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/i18n/graphql/build")
        }),
        environment: {
            variables: apolloServiceEnv
        }
    }),
    locales: new aws.lambda.Function("i18n-locales", {
        ...defaults.function,
        memorySize: 256,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/i18n/locales/build")
        }),
        environment: {
            variables: { DB_PROXY_FUNCTION: databaseProxy.arn, DEBUG: String(process.env.DEBUG) }
        }
    })
};

// ------------------------------------------------------------------------------------------
//                                      File Manager
// ------------------------------------------------------------------------------------------

const fileManager: {
    bucket: aws.s3.Bucket;
    manage?: aws.lambda.Function;
    transform?: aws.lambda.Function;
    graphql?: aws.lambda.Function;
    download?: aws.lambda.Function;
    manageS3LambdaPermission?: aws.lambda.Permission;
    bucketNotification?: aws.s3.BucketNotification;
} = {
    bucket: new aws.s3.Bucket("fm-bucket", {
        forceDestroy: false,
        acl: "private",
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["POST", "GET"],
                allowedOrigins: ["*"],
                maxAgeSeconds: 3000
            }
        ]
    })
};

fileManager.transform = new aws.lambda.Function("fm-image-transformer", {
    ...defaults.function,
    runtime: "nodejs10.x",
    memorySize: 1600,
    description: "Performs image optimization, resizing, etc.",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/files/transform/build")
    }),
    layers: [getLayerArn("webiny-v4-sharp", String(process.env.AWS_REGION))],
    environment: {
        variables: { S3_BUCKET: fileManager.bucket.id }
    }
});

fileManager.manage = new aws.lambda.Function("fm-manage", {
    ...defaults.function,
    description: "Triggered when a file is deleted.",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/files/manage/build")
    }),
    environment: {
        variables: { S3_BUCKET: fileManager.bucket.id }
    }
});

fileManager.graphql = new aws.lambda.Function("fm-graphql", {
    ...defaults.function,
    description: "Files GraphQL API",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/files/graphql/build")
    }),
    environment: {
        variables: { ...apolloServiceEnv, S3_BUCKET: fileManager.bucket.id }
    }
});

fileManager.download = new aws.lambda.Function("fm-download", {
    ...defaults.function,
    description: "Serves previously uploaded files.",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/files/download//build")
    }),
    environment: {
        variables: {
            S3_BUCKET: fileManager.bucket.id,
            IMAGE_TRANSFORMER_FUNCTION: fileManager.transform.arn
        }
    }
});

fileManager.manageS3LambdaPermission = new aws.lambda.Permission("fm-manage-s3-lambda-permission", {
    action: "lambda:InvokeFunction",
    function: fileManager.manage.arn,
    principal: "s3.amazonaws.com",
    sourceArn: fileManager.bucket.arn
});

fileManager.bucketNotification = new aws.s3.BucketNotification(
    "bucketNotification",
    {
        bucket: fileManager.bucket.id,
        lambdaFunctions: [
            {
                lambdaFunctionArn: fileManager.manage.arn,
                events: ["s3:ObjectRemoved:*"]
            }
        ]
    },
    {
        dependsOn: [fileManager.manageS3LambdaPermission]
    }
);

// ------------------------------------------------------------------------------------------
//                                      Page Builder
// ------------------------------------------------------------------------------------------

const pbInstallationZipPath = path.join(__dirname, "pbInstallation.zip");
createInstallationZip(pbInstallationZipPath);

const pbInstallationZip = new aws.s3.BucketObject(
    "./pbInstallation.zip",
    {
        key: "pbInstallation.zip",
        acl: "public-read",
        bucket: fileManager.bucket,
        contentType: "application/octet-stream",
        source: new pulumi.asset.FileAsset(pbInstallationZipPath)
    },
    {
        parent: fileManager.bucket
    }
);

const pageBuilder = {
    graphql: new aws.lambda.Function("pb-graphql", {
        ...defaults.function,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/pageBuilder/build")
        }),
        environment: {
            variables: {
                ...apolloServiceEnv,
                INSTALLATION_S3_BUCKET: fileManager.bucket.id,
                INSTALLATION_FILES_ZIP_KEY: pbInstallationZip.key
            }
        }
    })
};

// ------------------------------------------------------------------------------------------
//                                      Form Builder
// ------------------------------------------------------------------------------------------
const formBuilder = {
    graphql: new aws.lambda.Function("fb-graphql", {
        ...defaults.function,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/formBuilder/build")
        }),
        environment: {
            variables: {
                ...apolloServiceEnv,
                I18N_LOCALES_FUNCTION: i18n.locales.arn
            }
        }
    })
};

// ------------------------------------------------------------------------------------------
//                                      Headless CMS
// ------------------------------------------------------------------------------------------

const cms: {
    dataManager: aws.lambda.Function;
    graphql?: aws.lambda.Function;
    content?: aws.lambda.Function;
} = {
    dataManager: new aws.lambda.Function("cms-data-manager", {
        ...defaults.function,
        description: "CMS Data Manager",
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./code/cms/dataManager/build")
        }),
        environment: {
            variables: {
                MONGODB_SERVER: process.env.MONGODB_SERVER || "",
                MONGODB_NAME: process.env.MONGODB_NAME || "",
                I18N_LOCALES_FUNCTION: i18n.locales.arn
            }
        }
    })
};

cms.graphql = new aws.lambda.Function("cms-graphql", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/cms/graphql/build")
    }),
    environment: {
        variables: {
            ...apolloServiceEnv,
            CMS_DATA_MANAGER_FUNCTION: cms.dataManager.arn
        }
    }
});

cms.content = new aws.lambda.Function("cms-content", {
    ...defaults.function,
    description: "CMS Content API",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/cms/content/build")
    }),
    environment: {
        variables: {
            ...apolloServiceEnv,
            I18N_LOCALES_FUNCTION: i18n.locales.arn,
            CMS_DATA_MANAGER_FUNCTION: cms.dataManager.arn,
            SETTINGS_MANAGER_FUNCTION: settingsManager.getSettings.arn
        }
    }
});

// ------------------------------------------------------------------------------------------
//                                     Apollo Gateway
// ------------------------------------------------------------------------------------------

const apolloGateway = new aws.lambda.Function("apollo-gateway", {
    ...defaults.function,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./code/apolloGateway/build")
    }),
    environment: {
        variables: {
            ...apolloServiceEnv,
            LAMBDA_SERVICE_SECURITY: security.graphql.arn,
            LAMBDA_SERVICE_I18N: i18n.graphql.arn,
            LAMBDA_SERVICE_FILE_MANAGER: fileManager.graphql.arn,
            LAMBDA_SERVICE_PAGE_BUILDER: pageBuilder.graphql.arn,
            LAMBDA_SERVICE_FORM_BUILDER: formBuilder.graphql.arn,
            LAMBDA_SERVICE_HEADLESS_CMS: cms.graphql.arn
        }
    }
});

// ------------------------------------------------------------------------------------------
//                                      API Gateway
// ------------------------------------------------------------------------------------------

const apiGateway = new awsx.apigateway.API("api-gateway", {
    stageName: "default",
    restApiArgs: {
        description: "Main API Gateway",
        binaryMediaTypes: ["*/*"],
        endpointConfiguration: {
            types: "REGIONAL"
        }
    },
    routes: [
        {
            path: "/graphql",
            method: "ANY",
            eventHandler: apolloGateway
        },
        {
            path: "/files/{path}",
            method: "ANY",
            eventHandler: fileManager.download
        },
        {
            path: "/cms/{key+}",
            method: "ANY",
            eventHandler: cms.content
        }
    ]
});

// ------------------------------------------------------------------------------------------
//                                     Cloudfront CDN
// ------------------------------------------------------------------------------------------

const cdn = new aws.cloudfront.Distribution("my-cdn-for-api-gw", {
    waitForDeployment: false,
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        defaultTtl: 0,
        forwardedValues: {
            cookies: {
                forward: "none"
            },
            headers: ["Accept", "Accept-Language"],
            queryString: true
        },
        compress: true,
        maxTtl: 86400,
        minTtl: 0,
        targetOriginId: apiGateway.restAPI.name,
        viewerProtocolPolicy: "allow-all"
    },
    isIpv6Enabled: true,
    enabled: true,
    orderedCacheBehaviors: [
        {
            allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                cookies: {
                    forward: "none"
                },
                headers: ["Accept", "Accept-Language"],
                queryString: true
            },
            pathPattern: "/cms*",
            viewerProtocolPolicy: "allow-all",
            targetOriginId: apiGateway.restAPI.name
        },
        {
            defaultTtl: 2592000,
            allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                cookies: {
                    forward: "none"
                },
                headers: ["Accept", "Accept-Language"],
                queryString: true
            },
            pathPattern: "/files/*",
            viewerProtocolPolicy: "allow-all",
            targetOriginId: apiGateway.restAPI.name
        }
    ],
    origins: [
        {
            domainName: apiGateway.url.apply((url: string) => String(parse(url).hostname)),
            originPath: "/default",
            originId: apiGateway.restAPI.name,
            customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "https-only",
                originSslProtocols: ["TLSv1.2"]
            }
        }
    ],
    restrictions: {
        geoRestriction: {
            restrictionType: "none"
        }
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true
    }
});

export const region = process.env.AWS_REGION;
export const cdnDomain = cdn.domainName;
export const cognitoUserPoolId = cognito.userPool.id;
export const cognitoAppClientId = cognito.userPoolClient.id;
