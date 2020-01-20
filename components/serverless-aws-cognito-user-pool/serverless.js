const Cognito = require("aws-sdk/clients/cognitoidentityserviceprovider");
const { Component } = require("@serverless/core");
const isEqual = require("lodash.isequal");

const defaultPasswordPolicy = {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false,
    temporaryPasswordValidityDays: 7
};

class ServerlessAwsCognito extends Component {
    async default(inputs = {}) {
        if (isEqual(this.state.inputs, inputs)) {
            this.context.instance.debug("Input was not changed, no action required.");
            return this.state.output;
        }

        const {
            region = "us-east-1",
            name,
            tags = {},
            appClients = [],
            allowSignup = false
        } = inputs;
        const passwordPolicy = Object.assign({}, defaultPasswordPolicy, inputs.passwordPolicy);

        const cognito = new Cognito({ region });
        this.state.output = this.state.output || { appClients: [] };

        if (this.state.output.userPool) {
            // At this point we do not update user pool since we don't support
            // configuration parameters that can be updated.

            // Update app clients
            const count = Math.max(appClients.length, this.state.output.appClients.length);

            for (let i = 0; i < count; i++) {
                const { name, refreshTokenValidity = 30, generateSecret = false } =
                    appClients[i] || {};
                const clientInState = this.state.output.appClients[i];
                const clientInInput = appClients[i];

                if (clientInState && clientInInput) {
                    this.context.instance.debug(
                        `Updating client %o (%o).`,
                        clientInState.ClientName,
                        clientInState.ClientId
                    );

                    const clientParams = {
                        UserPoolId: this.state.output.userPool.Id,
                        ClientId: clientInState.ClientId,
                        ClientName: name,
                        RefreshTokenValidity: refreshTokenValidity
                    };
                    const { UserPoolClient } = await cognito
                        .updateUserPoolClient(clientParams)
                        .promise();
                    this.state.output.appClients[i] = UserPoolClient;
                    continue;
                }

                if (clientInState && !clientInInput) {
                    // Delete existing client
                    this.context.instance.debug(
                        `Deleting client %o (%o).`,
                        clientInState.ClientName,
                        clientInState.ClientId
                    );
                    const clientParams = {
                        UserPoolId: this.state.output.userPool.Id,
                        ClientId: clientInState.ClientId
                    };
                    await cognito.deleteUserPoolClient(clientParams).promise();
                    this.state.output.appClients[i] = null;
                    continue;
                }

                // Create new client
                this.context.instance.debug(`Creating new user pool client %o.`, name);
                const clientParams = {
                    UserPoolId: this.state.output.userPool.Id,
                    ClientName: name,
                    GenerateSecret: generateSecret,
                    RefreshTokenValidity: refreshTokenValidity
                };
                const { UserPoolClient } = await cognito
                    .createUserPoolClient(clientParams)
                    .promise();

                this.state.output.appClients[i] = UserPoolClient;
            }
            // Filter null values
            this.state.output.appClients = this.state.output.appClients.filter(Boolean);
        } else {
            this.context.instance.debug(`Creating new user pool.`);

            const params = {
                PoolName: this.context.instance.getResourceName(name),
                AdminCreateUserConfig: {
                    AllowAdminCreateUserOnly: !allowSignup
                },
                AutoVerifiedAttributes: ["email"],
                EmailConfiguration: {
                    EmailSendingAccount: "COGNITO_DEFAULT"
                },
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
                UserPoolAddOns: {
                    AdvancedSecurityMode: "OFF" /* required */
                },
                UserPoolTags: Object.assign({}, tags),
                UsernameAttributes: ["email"],
                VerificationMessageTemplate: {
                    DefaultEmailOption: "CONFIRM_WITH_CODE"
                }
            };

            const { UserPool } = await cognito.createUserPool(params).promise();
            this.state.output.userPool = UserPool;
            this.state.output.userPool.Region = region;
            await this.save();

            this.context.instance.debug(`Created user pool %o.`, UserPool.Id);

            // Create app clients
            for (let i = 0; i < appClients.length; i++) {
                this.context.instance.debug(`Creating new user pool client.`);
                const { name, refreshTokenValidity = 30, generateSecret = false } = appClients[i];
                const clientParams = {
                    UserPoolId: this.state.output.userPool.Id,
                    ClientName: name,
                    GenerateSecret: generateSecret,
                    RefreshTokenValidity: refreshTokenValidity
                };
                const { UserPoolClient } = await cognito
                    .createUserPoolClient(clientParams)
                    .promise();
                this.state.output.appClients[i] = UserPoolClient;
            }
        }

        this.state.inputs = inputs;
        await this.save();

        return this.state.output;
    }

    async remove() {
        if (!this.state.inputs) {
            return;
        }

        const { region } = this.state.inputs;
        const cognito = new Cognito({ region });
        const UserPoolId = this.state.output.userPool.Id;

        this.context.instance.debug(`Removing Cognito User Pool %o.`, UserPoolId);

        await cognito
            .deleteUserPool({
                UserPoolId
            })
            .promise();

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsCognito;
