import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/api/types.js";
import { GetBackgroundTaskSettingsRepository } from "~/api/features/GetBackgroundTaskSettings/abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import type { IUpdateBackgroundTaskSettingsInput } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { checkPermissions } from "./checkPermissions.js";

interface IUpdateSettingsArgs {
    input: IUpdateBackgroundTaskSettingsInput;
}

const resolve = async <T = unknown>(fn: () => Promise<T>) => {
    try {
        const data = await fn();
        return { data, error: null };
    } catch (error: any) {
        return {
            data: null,
            error: {
                message: error.message,
                code: error.code,
                data: error.data
            }
        };
    }
};

export const createBackgroundTaskSettingsGraphQL = (): Plugin[] => {
    const plugin = new ContextPlugin<Context>(async ctx => {
        if (!ctx.tenancy.getCurrentTenant()) {
            return;
        }

        const schema = new GraphQLSchemaPlugin<Context>({
            typeDefs: /* GraphQL */ `
                type WebinyBackgroundTaskSettings {
                    retentionDays: Int
                }

                type WebinyBackgroundTaskSettingsResponse {
                    data: WebinyBackgroundTaskSettings
                    error: WebinyBackgroundTaskError
                }

                input UpdateBackgroundTaskSettingsInput {
                    retentionDays: Int
                }

                extend type WebinyBackgroundTaskQuery {
                    getSettings: WebinyBackgroundTaskSettingsResponse
                }

                extend type WebinyBackgroundTaskMutation {
                    updateSettings(
                        input: UpdateBackgroundTaskSettingsInput!
                    ): WebinyBackgroundTaskSettingsResponse
                }
            `,
            resolvers: {
                WebinyBackgroundTaskQuery: {
                    getSettings: async (_, __, context) => {
                        return resolve(async () => {
                            await checkPermissions(context, { rwd: "r" });
                            const repository = context.container.resolve(
                                GetBackgroundTaskSettingsRepository
                            );
                            const result = await repository.execute();
                            if (result.isFail()) {
                                throw result.error;
                            }
                            return result.value;
                        });
                    }
                },
                WebinyBackgroundTaskMutation: {
                    updateSettings: async (_, args: IUpdateSettingsArgs, context) => {
                        return resolve(async () => {
                            const useCase = context.container.resolve(
                                UpdateBackgroundTaskSettingsUseCase
                            );
                            const result = await useCase.execute(args.input);
                            if (result.isFail()) {
                                throw result.error;
                            }
                            return result.value;
                        });
                    }
                }
            }
        });

        schema.name = "backgroundTasks.settings.graphql.schema";
        ctx.plugins.register(schema);
    });

    plugin.name = "backgroundTasks.settings.graphql";

    return [plugin];
};
