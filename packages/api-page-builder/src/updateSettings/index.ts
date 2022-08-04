import { PageBuilderStorageOperations, Settings } from "~/types";
import { migrate, putDefaultSettings, SettingsInput } from "./migration/migrate";
import { RoutePlugin } from "@webiny/handler";

export interface HandlerArgs {
    data: Settings;
    migrate?: boolean;
}

interface HandlerResponseError {
    message: string;
    code?: string;
    data: Record<string, any> | null;
}

export interface HandlerResponse {
    data: boolean;
    error: HandlerResponseError | null;
}

function createSettings(data: Settings): SettingsInput {
    return {
        ...data.prerendering,
        websiteUrl: data.websiteUrl
    };
}
/**
 * Updates system default settings, for all tenants and all locales. Of course, these values can later be overridden
 * via the settings UI in the Admin app. But it's with these settings that every new tenant / locale will start off.
 */
export interface UpdateSettingsParams {
    storageOperations: PageBuilderStorageOperations;
}
export default (params: UpdateSettingsParams) => {
    const { storageOperations } = params;

    const route = new RoutePlugin(({ onAll }) => {
        onAll("*", async (request, reply) => {
            try {
                const { data, migrate: runMigration } = request.body as Record<string, any>;

                // In 5.29.0, we need to migrate data for Prerendering Service and Tenants
                if (process.env.NODE_ENV !== "test") {
                    const executed = await migrate(
                        storageOperations,
                        createSettings(data),
                        runMigration === true
                    );

                    if (executed) {
                        return reply.send({
                            data: true,
                            error: null
                        });
                    }
                }

                await putDefaultSettings(storageOperations, createSettings(data));

                return reply.send({
                    data: true,
                    error: null
                });
            } catch (ex) {
                return reply.send({
                    data: false,
                    error: {
                        message: ex.message,
                        code: ex.code || "UNKNOWN",
                        data: {
                            ...(ex.data || {})
                        }
                    }
                });
            }
        });
    });

    route.name = "pageBuilder.route.updateSettings";

    return route;
};
