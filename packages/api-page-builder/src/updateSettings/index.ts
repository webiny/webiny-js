import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { PageBuilderStorageOperations, PbContext, Settings } from "~/types";
import { migrate, putDefaultSettings, SettingsInput } from "./migration/migrate";

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
export default (
    params: UpdateSettingsParams
): HandlerPlugin<PbContext, ArgsContext<HandlerArgs>> => {
    const { storageOperations } = params;

    return {
        type: "handler",
        async handle(context): Promise<HandlerResponse> {
            try {
                const { invocationArgs: args } = context;

                // In 5.29.0, we need to migrate data for Prerendering Service and Tenants
                if (process.env.NODE_ENV !== "test") {
                    const executed = await migrate(
                        storageOperations,
                        createSettings(args.data),
                        args.migrate === true
                    );

                    if (executed) {
                        return {
                            data: true,
                            error: null
                        };
                    }
                }

                await putDefaultSettings(storageOperations, createSettings(args.data));

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
        }
    };
};
