import { PageBuilderStorageOperations, Settings } from "~/types";
import { migrate, putDefaultSettings, SettingsInput } from "./migration/migrate";
import { EventPlugin } from "@webiny/handler";

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

interface PayloadBody {
    data?: Settings;
    migrate?: boolean;
}
interface Payload {
    body: string | PayloadBody;
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

    const route = new EventPlugin<Payload>(async ({ payload }) => {
        try {
            const body = payload.body as Payload["body"];

            const result: PayloadBody = typeof body === "string" ? JSON.parse(body) : body;
            if (!result?.data) {
                return {
                    data: false,
                    error: {
                        message: "Missing data to be processed.",
                        code: "DATA_ERROR",
                        data: {
                            body
                        }
                    }
                };
            }
            const { data, migrate: runMigration } = result;
            // In 5.29.0, we need to migrate data for Prerendering Service and Tenants
            if (process.env.NODE_ENV !== "test") {
                const executed = await migrate(
                    storageOperations,
                    createSettings(data),
                    runMigration === true
                );

                if (executed) {
                    return {
                        data: true,
                        error: null
                    };
                }
            }

            await putDefaultSettings(storageOperations, createSettings(data));

            return {
                data: true,
                error: null
            };
        } catch (ex) {
            return {
                data: false,
                error: {
                    message: ex.message,
                    code: ex.code || "UNKNOWN",
                    data: {
                        ...(ex.data || {})
                    }
                }
            };
        }
    });

    route.name = "pageBuilder.event.updateSettings";

    return route;
};
