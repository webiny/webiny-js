import crypto from "crypto";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { createTopic } from "@webiny/pubsub";
import { mdbid } from "@webiny/utils";
import { NotAuthorizedError } from "~/index";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { ApiKey, ApiKeyInput, ApiKeyPermission, Security } from "~/types";
import { SecurityConfig } from "~/types";

const APIKeyModel = withFields({
    name: string({ validation: validation.create("required") }),
    description: string({ validation: validation.create("required") }),
    permissions: object({ list: true, value: [] })
})();

const generateToken = (tokenLength = 48): string => {
    const token = crypto.randomBytes(Math.ceil(tokenLength / 2)).toString("hex");

    // API Keys are prefixed with a letter "a" to make token verification easier.
    // When authentication plugins kick in, they will be able to tell if they should handle the token by
    // checking the first letter and either process the token or skip authentication completely.
    if (token.startsWith("a")) {
        return token;
    }

    return `a${token.slice(0, tokenLength - 1)}`;
};

export const createApiKeysMethods = ({
    getTenant: initialGetTenant,
    storageOperations
}: SecurityConfig) => {
    const getTenant = () => {
        const tenant = initialGetTenant();
        if (!tenant) {
            throw new WebinyError("Missing tenant.");
        }
        return tenant;
    };
    return {
        onApiKeyBeforeCreate: createTopic("security.onApiKeyBeforeCreate"),
        onApiKeyAfterCreate: createTopic("security.onApiKeyAfterCreate"),
        onApiKeyBeforeBatchCreate: createTopic("security.onApiKeyBeforeBatchCreate"),
        onApiKeyAfterBatchCreate: createTopic("security.onApiKeyAfterBatchCreate"),
        onApiKeyBeforeUpdate: createTopic("security.onApiKeyBeforeUpdate"),
        onApiKeyAfterUpdate: createTopic("security.onApiKeyAfterUpdate"),
        onApiKeyBeforeDelete: createTopic("security.onApiKeyBeforeDelete"),
        onApiKeyAfterDelete: createTopic("security.onApiKeyAfterDelete"),

        async getApiKeyByToken(token: string) {
            try {
                return await storageOperations.getApiKeyByToken({
                    tenant: getTenant(),
                    token
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get API key by token.",
                    ex.code || "GET_API_KEY_BY_TOKEN_ERROR",
                    {
                        token
                    }
                );
            }
        },

        async getApiKey(this: Security, id: string) {
            // Check if it's an ID or an actual API key (API keys start with a letter "a")
            const permission = await this.getPermission<ApiKeyPermission>("security.apiKey");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            try {
                return await storageOperations.getApiKey({
                    tenant: getTenant(),
                    id
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get API key.",
                    ex.code || "GET_API_KEY_ERROR",
                    {
                        id
                    }
                );
            }
        },

        async listApiKeys(this: Security) {
            const permission = await this.getPermission<ApiKeyPermission>("security.apiKey");

            if (!permission) {
                throw new NotAuthorizedError();
            }
            try {
                return await storageOperations.listApiKeys({
                    where: {
                        tenant: getTenant()
                    },
                    sort: ["createdOn_ASC"]
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list API keys.",
                    ex.code || "LIST_API_KEY_ERROR"
                );
            }
        },

        async createApiKey(this: Security, data: ApiKeyInput) {
            const identity = this.getIdentity();
            const permission = await this.getPermission<ApiKeyPermission>("security.apiKey");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            await new APIKeyModel().populate(data).validate();

            const apiKey: ApiKey = {
                id: mdbid(),
                tenant: getTenant(),
                token: generateToken(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                createdOn: new Date().toISOString(),
                webinyVersion: process.env.WEBINY_VERSION,
                ...data
            };

            try {
                await this.onApiKeyBeforeCreate.publish({ apiKey });
                const result = await storageOperations.createApiKey({
                    apiKey
                });
                await this.onApiKeyAfterCreate.publish({ apiKey: result });

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create API key.",
                    ex.code || "CREATE_API_KEY_ERROR",
                    {
                        apiKey
                    }
                );
            }
        },

        async updateApiKey(this: Security, id: string, data: Record<string, any>) {
            const permission = await this.getPermission<ApiKeyPermission>("security.apiKey");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const model = await new APIKeyModel().populate(data);
            await model.validate();
            const changedData = await model.toJSON({ onlyDirty: true });

            const original = await this.getApiKey(id);
            if (!original) {
                throw new NotFoundError(`API key "${id}" was not found!`);
            }

            const apiKey: ApiKey = {
                ...original,
                ...changedData
            };
            try {
                await this.onApiKeyBeforeUpdate.publish({ original, apiKey });
                const result = await storageOperations.updateApiKey({
                    original,
                    apiKey
                });
                await this.onApiKeyAfterUpdate.publish({ original, apiKey: result });

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update API key.",
                    ex.code || "UPDATE_API_KEY_ERROR",
                    {
                        original,
                        apiKey
                    }
                );
            }
        },

        async deleteApiKey(this: Security, id: string) {
            const permission = await this.getPermission<ApiKeyPermission>("security.apiKey");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const apiKey = await this.getApiKey(id);
            if (!apiKey) {
                throw new NotFoundError(`API key "${id}" was not found!`);
            }

            try {
                await this.onApiKeyBeforeDelete.publish({ apiKey });
                await storageOperations.deleteApiKey({ apiKey });
                await this.onApiKeyAfterDelete.publish({ apiKey });

                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete API key.",
                    ex.code || "DELETE_API_KEY_ERROR",
                    {
                        apiKey
                    }
                );
            }
        }
    };
};
