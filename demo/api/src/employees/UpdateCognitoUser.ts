import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider";
import { UpdateEmployeeInput } from "../types";

const updateAttributes: Record<string, string> = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email",
    email: "email"
};

export class UpdateCognitoUser {
    private cognito: CognitoIdentityProvider;
    private readonly userPoolId: string;

    constructor(cognito: CognitoIdentityProvider, userPoolId: string) {
        this.cognito = cognito;
        this.userPoolId = userPoolId;
    }

    async execute(employee: UpdateEmployeeInput): Promise<void> {
        const newAttributes = Object.keys(updateAttributes).map(attr => {
            const mappedAttr = updateAttributes[attr] as keyof UpdateEmployeeInput;

            return { Name: attr, Value: employee[mappedAttr] };
        });

        newAttributes.push({
            Name: "email_verified",
            Value: "true"
        });

        const params = {
            UserAttributes: newAttributes,
            UserPoolId: this.userPoolId,
            Username: employee.id
        };

        await this.cognito.adminUpdateUserAttributes(params);

        if (employee.password !== "") {
            const pass = {
                Permanent: true,
                Password: employee.password,
                Username: employee.id,
                UserPoolId: this.userPoolId
            };

            await this.cognito.adminSetUserPassword(pass);
        }
    }
}
