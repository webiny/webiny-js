import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider";

export class CognitoEmailIsTaken {
    private cognito: CognitoIdentityProvider;
    private readonly userPoolId: string;

    constructor(cognito: CognitoIdentityProvider, userPoolId: string) {
        this.cognito = cognito;
        this.userPoolId = userPoolId;
    }

    /**
     * Returns `true` if email is taken.
     * @param email
     */
    async execute(email: string): Promise<boolean> {
        try {
            await this.cognito.adminGetUser({
                Username: email.toLowerCase(),
                UserPoolId: this.userPoolId
            });

            return true;
        } catch (err) {
            return false;
        }
    }
}
