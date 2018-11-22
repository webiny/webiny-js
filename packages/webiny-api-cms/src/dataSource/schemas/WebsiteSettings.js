// @flow
const websiteSettingsFetcher = ctx => ctx.cms.WebsiteSettings;
import { Response } from "webiny-api/graphql";

export default {
    typeDefs: () => [
        `type WebsiteSettings {
            _empty: String
        }
        
        type WebsiteSettingsResponse {
            data: WebsiteSettings
            error: Error
        }
        
        extend type CmsQuery {
            # Returns website settings.
            getWebsiteSettings: WebsiteSettingsResponse
        }
        
        extend type CmsMutation {
            # Updates website settings 
             updateWebsiteSettings(data: JSON!): WebsiteSettingsResponse
        },
    `
    ],
    resolvers: {
        CmsQuery: {
            getWebsiteSettings: async (_: any, args: Object, ctx: Object) => {
                const WebsiteSettings = websiteSettingsFetcher(ctx);
                const settings = await WebsiteSettings.load();
                if (settings) {
                    return new Response(settings.data);
                }
            }
        },
        CmsMutation: {
            // Publish revision (must be given an exact revision ID to publish)
            updateWebsiteSettings: async (_: any, { data }: Object, ctx: Object) => {
                const WebsiteSettings = websiteSettingsFetcher(ctx);
                let settings = await WebsiteSettings.load();
                if (!settings) {
                    settings = new WebsiteSettings();
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
