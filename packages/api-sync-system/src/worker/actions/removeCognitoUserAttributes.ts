/**
 * We need to remove some of the attributes from the Cognito user object before we store it via the Sync System.
 * sub - not allowed to be set by our code
 */
import type { AttributeType } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";

const removeAttributes: string[] = ["sub"];

export const removeCognitoUserAttributes = (attributes: AttributeType[]): AttributeType[] => {
    return attributes.filter(attr => {
        const name = (attr.Name || "").toLowerCase();
        if (removeAttributes.includes(name)) {
            return false;
        }
        return true;
    });
};
