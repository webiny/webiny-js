// @flow

export default [
    {
        name: "schema-settings-cms",
        type: "schema-settings",
        typeDefs: `
            type CmsSettings {
                name: String
            } 
            
            extend type SettingsQuery {
                cms: CmsSettings
            }
        `,
        resolvers: {
            SettingsQuery: {
                cms: () => {
                    return { name: "CMS kobaja" };
                }
            }
        }
    }
];
