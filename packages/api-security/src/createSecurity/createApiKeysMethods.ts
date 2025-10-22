// @ts-nocheck Going away
import crypto from "crypto";
import { createTopic } from "@webiny/pubsub";
import { createZodError, mdbid } from "@webiny/utils";
import { NotAuthorizedError } from "~/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import type { ApiKey, ApiKeyInput, ApiKeyPermission, Security, SecurityConfig } from "~/types.js";
import zod from "zod";

const apiKeyModelValidation = zod.object({
    name: zod.string(),
    description: zod.string(),
    permissions: zod
        .array(
            zod
                .object({
                    name: zod.string()
                })
                .passthrough()
        )
        .optional()
        .default([])
});

const createApiKeyModelValidation = apiKeyModelValidation.extend({
    id: zod.string().optional(),
    token: zod
        .string()
        .optional()
        .refine(val => !val || val.startsWith("a"), {
            message: 'Token must start with letter "a"'
        })
});

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

            const validation = createApiKeyModelValidation.safeParse(data);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

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
                ...validation.data
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

            const validation = apiKeyModelValidation.safeParse(data);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

            const original = await this.getApiKey(id);
            if (!original) {
                throw new NotFoundError(`API key "${id}" was not found!`);
            }

            const apiKey: ApiKey = {
                ...original
            };
            for (const key in apiKey) {
                // @ts-expect-error
                const value = validation.data[key];
                if (value === undefined) {
                    continue;
                }
                // @ts-expect-error
                apiKey[key] = value;
            }
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
