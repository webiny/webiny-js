import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { UserAfterUpdateHandler } from "@webiny/api-core/features/UpdateUser";
import { createImplementation } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { CognitoConfig, type AttributeGetter } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

class UserAfterUpdateHandlerImpl implements UserAfterUpdateHandler.Interface {
    private cognito: CognitoIdentityProvider;
    private updateAttributes: Record<string, string | AttributeGetter>;

    constructor(private config: CognitoConfig.Interface) {
        this.cognito = new CognitoIdentityProvider({ region: config.region });
        this.updateAttributes = defaultUpdateAttributes;
    }

    async handle(event: UserAfterUpdateHandler.Event): Promise<void> {
        const { originalUser, updatedUser, input } = event.payload;

        if (originalUser.external) {
            return;
        }

        const newAttributes = Object.keys(this.updateAttributes).map(attr => {
            const mappedAttr = this.updateAttributes[
                attr as keyof typeof this.updateAttributes
            ] as MappedAttrType;
            const attrValue =
                typeof mappedAttr === "function"
                    ? mappedAttr(updatedUser)
                    : updatedUser[mappedAttr];
            return { Name: attr, Value: attrValue };
        });

        if (originalUser.email !== updatedUser.email) {
            newAttributes.push({
                Name: "email_verified",
                Value: "true"
            });
        }

        const params = {
            UserAttributes: newAttributes,
            UserPoolId: this.config.userPoolId,
            Username: Username.fromUser(originalUser)
        };

        await this.cognito.adminUpdateUserAttributes(params);

        const { password } = input || {};
        if (password) {
            const pass = {
                Permanent: true,
                Password: password,
                Username: Username.fromUser(updatedUser),
                UserPoolId: this.config.userPoolId
            };

            await this.cognito.adminSetUserPassword(pass);
        }
    }
}

export const CognitoUserAfterUpdateHandler = createImplementation({
    abstraction: UserAfterUpdateHandler,
    implementation: UserAfterUpdateHandlerImpl,
    dependencies: [CognitoConfig]
});
