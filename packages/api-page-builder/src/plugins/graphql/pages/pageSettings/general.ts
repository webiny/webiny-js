export default  [
    {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbGeneralPageSettings {
                    tags: [String]
                    layout: String
                    image: PbFile
                }

                input PbGeneralPageSettingsInput {
                    tags: [String]
                    layout: String
                    image: PbFileInput
                }

                extend type PbPageSettings {
                    general: PbGeneralPageSettings
                }

                extend input PbPageSettingsInput {
                    general: PbGeneralPageSettingsInput
                }
            `
        }
    }
];
