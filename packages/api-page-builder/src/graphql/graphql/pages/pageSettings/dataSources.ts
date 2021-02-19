import gql from "graphql-tag";

export default [
    {
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                extend type PbPageSettings {
                    dataSources: [JSON]
                }

                extend input PbPageSettingsInput {
                    dataSources: [JSON]
                }
            `
        }
    }
];
