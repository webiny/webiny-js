// @flow
import getCmsSettings from "./cmsSettingsResolvers/getCmsSettings";
import updateCmsSettings from "./cmsSettingsResolvers/updateCmsSettings";
const cmsSettingsFetcher = ctx => ctx.cms.CmsSettings;

export default {
    typeDefs: () => [
        `
        input CmsSettingsInput {
            _empty: String
        }
        
        type CmsSettings {
            _empty: String
        }
        
        type CmsSettingsResponse {
            data: CmsSettings
            error: Error
        }
        
        extend type CmsQuery {
            getCmsSettings: CmsSettingsResponse
        }
        
        extend type CmsMutation {
            updateCmsSettings: CmsSettingsResponse
        }
        `
    ],
    resolvers: {
        CmsQuery: {
            getCmsSettings: getCmsSettings(cmsSettingsFetcher)
        },
        CmsMutation: {
            updateCmsSettings: updateCmsSettings(cmsSettingsFetcher)
        }
    }
};
