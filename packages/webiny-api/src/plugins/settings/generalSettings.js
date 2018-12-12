// @flow
import { type SettingsPluginType } from "webiny-api/types";
export default ([
    {
        name: "schema-settings-general",
        type: "schema-settings",
        namespace: "general",
        typeDefs: `
            type CmsSocialMedia {
                facebook: String
                twitter: String
                instagram: String
            } 
            
            input CmsSocialMediaInput {
                facebook: String
                twitter: String
                instagram: String
            } 
            
            type GeneralSettings {
                name: String
                favicon: File
                logo: File
                social: CmsSocialMedia
            }
            
            input GeneralSettingsInput {
                name: String
                favicon: FileInput
                logo: FileInput
                social: CmsSocialMediaInput
            } 
            
            extend type SettingsQuery {
                general: GeneralSettings
            }  
            
            extend type SettingsMutation {
                general(data: GeneralSettingsInput): GeneralSettings
            }
        `,
        entity: ({
            api: {
                entities: { GeneralSettings }
            }
        }) => GeneralSettings
    }
]: Array<SettingsPluginType>);
