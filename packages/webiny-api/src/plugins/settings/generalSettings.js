// @flow

export default [
    {
        name: "schema-settings-general",
        type: "schema-settings",
        typeDefs: `
            type CmsSocialMedia {
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
            
            extend type SettingsQuery {
                general: GeneralSettings
            }
        `,
        resolvers: {
            SettingsQuery: {
                general: () => {
                    return { name: "kobaja" };
                }
            }
        }
    }
];
