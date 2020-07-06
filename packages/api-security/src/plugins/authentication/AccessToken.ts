import LambdaClient from "aws-sdk/clients/lambda";

type UserRequest = {
    id: string;
};

export class AccessTokenError extends Error {
    message: string;
    code: string;
    constructor({ message, code }: { message: string; code: string }) {
        super();
        this.message = message;
        this.code = code;
    }
}

export class AccessToken {
    token: string;
    validateAccessTokenFunction: string;

    constructor({ token, validateAccessTokenFunction }) {
        this.token = token;
        this.validateAccessTokenFunction = validateAccessTokenFunction;
    }

    async getUser() {
        try {
            const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
            let userRequest = (
                await Lambda.invoke({
                    FunctionName: this.validateAccessTokenFunction,
                    Payload: JSON.stringify({ PAT: this.token })
                }).promise()
            ).Payload as UserRequest;

            if (typeof userRequest === "string") {
                userRequest = JSON.parse(userRequest);
            }

            if (!userRequest.id) {
                throw new AccessTokenError({
                    message: "Your Personal Access Token is invalid.",
                    code: "TOKEN_INVALID"
                });
            }

            return userRequest;
        } catch (e) {
            throw e;
        }
    }
}
