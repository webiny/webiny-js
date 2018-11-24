// @flow
const systemSettingsFetcher = ctx => ctx.cms.SystemSettings;
import { Response } from "webiny-api/graphql";

export default {
    typeDefs: () => [
        `type SystemSettings {
            _empty: String
        }
        
        type SystemSettingsResponse {
            data: SystemSettings
            error: Error
        }
        
        extend type CmsQuery {
            # Returns website settings.
            getSystemSettings: SystemSettingsResponse
        }
        
        extend type CmsMutation {
            # Updates website settings 
             updateSystemSettings(data: JSON!): SystemSettingsResponse
        },
    `
    ],
    resolvers: {
        CmsQuery: {
            getSystemSettings: async (_: any, args: Object, ctx: Object) => {
                const SystemSettings = systemSettingsFetcher(ctx);
                const settings = await SystemSettings.load();
                if (settings) {
                    return new Response(settings.data);
                }
            }
        },
        CmsMutation: {
            // Publish revision (must be given an exact revision ID to publish)
            updateSystemSettings: async (_: any, { data }: Object, ctx: Object) => {
                const SystemSettings = systemSettingsFetcher(ctx);
                let settings = await SystemSettings.load();
                if (!settings) {
                    settings = new SystemSettings();
                }

                await settings.populate({ data }).save();
                return new Response(settings.data);
            }
        },
        PageSettings: {
            _empty: () => ""
        }
    }
};
