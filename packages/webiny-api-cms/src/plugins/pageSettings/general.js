import { gql } from "apollo-server-lambda";
import { EntityModel } from "webiny-entity";

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
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
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
                type PageBuilderGeneralPageSettings {
                    tags: [String]
                    layout: String
                    image: File
                }

                extend type PageBuilderPageSettings {
                    general: PageBuilderGeneralPageSettings
                }
            `,
            resolvers: {
                PageBuilderGeneralPageSettings: {
                    image: ({ image }) => {
                        return { __typename: "File", id: image };
                    }
                }
            }
        }
    }
];
