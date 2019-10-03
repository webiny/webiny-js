const Cognito = require("aws-sdk/clients/cognitoidentityserviceprovider");
const { Component } = require("@serverless/core");
const tracking = require("@webiny/serverless-component-tracking");
const isEqual = require("lodash.isequal");

const defaultPasswordPolicy = {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false,
    temporaryPasswordValidityDays: 7
};

const component = "@webiny/serverless-aws-cognito-user-pool";

class ServerlessAwsCognito extends Component {
    async default({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component });

        if (isEqual(this.state.input, inputs)) {
            this.context.debug("Input was not changed, no action required.");
            return this.state.output;
        } else {
            // TODO: need to update userPool if it already exists.
        }

        const { region = "us-east-1", name, tags = {} } = inputs;
        const passwordPolicy = Object.assign({}, defaultPasswordPolicy, inputs.passwordPolicy);

        const params = {
            PoolName: name,
            AdminCreateUserConfig: {
                AllowAdminCreateUserOnly: false
            },
            /*AliasAttributes: [
                phone_number | email | preferred_username
            ],*/
            AutoVerifiedAttributes: ["email"],
            /*DeviceConfiguration: {
                ChallengeRequiredOnNewDevice: true || false,
                DeviceOnlyRememberedOnUserPrompt: true || false
            },*/
            EmailConfiguration: {
                EmailSendingAccount: "COGNITO_DEFAULT"
                /*ReplyToEmailAddress: "STRING_VALUE",
                SourceArn: "STRING_VALUE"*/
            },
            /*EmailVerificationMessage: "STRING_VALUE",
            EmailVerificationSubject: "STRING_VALUE",*/
            /*LambdaConfig: {
                CreateAuthChallenge: "STRING_VALUE",
                CustomMessage: "STRING_VALUE",
                DefineAuthChallenge: "STRING_VALUE",
                PostAuthentication: "STRING_VALUE",
                PostConfirmation: "STRING_VALUE",
                PreAuthentication: "STRING_VALUE",
                PreSignUp: "STRING_VALUE",
                PreTokenGeneration: "STRING_VALUE",
                UserMigration: "STRING_VALUE",
                VerifyAuthChallengeResponse: "STRING_VALUE"
            },*/
            MfaConfiguration: "OFF",
            Policies: {
                PasswordPolicy: {
                    MinimumLength: passwordPolicy.minimumLength,
                    RequireLowercase: passwordPolicy.requireLowercase,
                    RequireNumbers: passwordPolicy.requireNumbers,
                    RequireSymbols: passwordPolicy.requireSymbols,
                    RequireUppercase: passwordPolicy.requireUppercase,
                    TemporaryPasswordValidityDays: passwordPolicy.temporaryPasswordValidityDays
                }
            },
            Schema: [
                {
                    AttributeDataType: "String",
                    DeveloperOnlyAttribute: false,
                    Mutable: true,
                    Name: "email",
                    Required: true
                },
                {
                    AttributeDataType: "String",
                    DeveloperOnlyAttribute: false,
                    Mutable: true,
                    Name: "family_name",
                    Required: true
                },
                {
                    AttributeDataType: "String",
                    DeveloperOnlyAttribute: false,
                    Mutable: true,
                    Name: "given_name",
                    Required: true
                }
            ],
            /*SmsAuthenticationMessage: "STRING_VALUE",
            SmsConfiguration: {
                SnsCallerArn: "STRING_VALUE" /!* required *!/,
                ExternalId: "STRING_VALUE"
            },
            SmsVerificationMessage: "STRING_VALUE",*/
            UserPoolAddOns: {
                AdvancedSecurityMode: "OFF" /* required */
            },
            UserPoolTags: Object.assign({}, tags),
            UsernameAttributes: ["email"],
            VerificationMessageTemplate: {
                DefaultEmailOption: "CONFIRM_WITH_CODE"
                /*EmailMessage: "STRING_VALUE",
                EmailMessageByLink: "STRING_VALUE",
                EmailSubject: "STRING_VALUE",
                EmailSubjectByLink: "STRING_VALUE",
                SmsMessage: "STRING_VALUE"*/
            }
        };

        const cognito = new Cognito({ region });

        const { UserPool } = await cognito.createUserPool(params).promise();

        this.context.debug(`Created Cognito User Pool ${UserPool.Id}`);

        this.state.output = UserPool;
        this.state.output.id = UserPool.Id;
        this.state.inputs = inputs;
        await this.save();

        return UserPool;
    }

    async remove({ track, ...inputs } = {}) {
        await tracking({ track, context: this.context, component, method: "remove" });

        const { region = "us-east-1" } = inputs;
        const cognito = new Cognito({ region });

        this.context.debug(`Removing Cognito User Pool ${this.state.output.id}`);

        await cognito
            .deleteUserPool({
                UserPoolId: this.state.output.id
            })
            .promise();

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsCognito;
