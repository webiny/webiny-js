import { gql } from "apollo-server-lambda";
import { EntityModel } from "@webiny/entity";

const createGeneralSettingsModel = context =>
    class GeneralSettings extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.page);
            this.attr("tags").array();
            this.attr("layout").char();
            this.attr("image").char();
        }
    };

export default [
    {
        name: "pb-page-settings-general",
        type: "pb-page-settings-model",
        apply(context) {
            context.model
                .attr("general")
                .model(createGeneralSettingsModel(context))
                .setDefaultValue({});
        }
    },
    {
        name: "graphql-schema-page-builder-settings-general",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type PbGeneralPageSettings {
                    tags: [String]
                    layout: String
                    image: File
                }

                input PbGeneralPageSettingsInput {
                    tags: [String]
                    layout: String
                    image: RefInput
                }

                extend type PbPageSettings {
                    general: PbGeneralPageSettings
                }
                
                extend input PbPageSettingsInput {
                    general: PbGeneralPageSettingsInput
                }
            `,
            resolvers: {
               PbGeneralPageSettings: {
                    image: ({ image }) => {
                        return { __typename: "File", id: image };
                    }
                }
            }
        }
    }
];
