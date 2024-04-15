import {
    AdminCreateUserRequest,
    CognitoIdentityProvider
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { CreateEmployeeInput } from "../types";
import { Email } from "./Email";

export class CreateCognitoUser {
    private cognito: CognitoIdentityProvider;
    private readonly userPoolId: string;

    constructor(cognito: CognitoIdentityProvider, userPoolId: string) {
        this.cognito = cognito;
        this.userPoolId = userPoolId;
    }

    async execute(employee: CreateEmployeeInput): Promise<void> {
        const email = Email.create(employee.email);

        const params: AdminCreateUserRequest = {
            UserPoolId: this.userPoolId,
            Username: employee.id,
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            TemporaryPassword: employee.password,
            UserAttributes: [
                {
                    Name: "custom:wby_user_id",
                    Value: employee.id
                },
                {
                    Name: "given_name",
                    Value: employee.firstName
                },
                {
                    Name: "family_name",
                    Value: employee.lastName
                },
                {
                    Name: "preferred_username",
                    Value: email
                },
                {
                    Name: "email",
                    Value: email
                }
            ]
        };

        await this.cognito.adminCreateUser(params);

        const verify = {
            UserPoolId: this.userPoolId,
            Username: email,
            UserAttributes: [
                {
                    Name: "email_verified",
                    Value: "true"
                }
            ]
        };

        await this.cognito.adminUpdateUserAttributes(verify);

        await this.cognito.adminSetUserPassword({
            Permanent: true,
            Password: employee.password,
            Username: employee.id,
            UserPoolId: this.userPoolId
        });
    }
}
