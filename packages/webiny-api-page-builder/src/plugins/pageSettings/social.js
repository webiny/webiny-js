import { gql } from "apollo-server-lambda";
import { EntityModel } from "webiny-entity";
import { Model } from "webiny-model";

class OpenGraphTagModel extends Model {
    constructor() {
        super();
        this.attr("property").char();
        this.attr("content").char();
    }
}

const createSocialSettings = context =>
    class SocialSettings extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.page);
            this.attr("meta").models(OpenGraphTagModel);
            this.attr("title").char();
            this.attr("description").char();
            this.attr("image").char();
        }
    };

export default [
    {
        name: "pb-page-settings-social",
        type: "pb-page-settings-model",
        apply(context) {
            context.model
                .attr("social")
                .model(createSocialSettings(context))
                .setDefaultValue({});
        }
    },
    {
        name: "graphql-schema-page-builder-settings-social",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type PbOpenGraphTag {
                    property: String
                    content: String
                }

                input PbOpenGraphTagInput {
                    property: String!
                    content: String!
                }

                type PbSocialSettings {
                    title: String
                    description: String
                    meta: [PbOpenGraphTag]
                    image: File
                }

                input PbSocialSettingsInput {
                    title: String
                    description: String
                    meta: [PbOpenGraphTagInput!]
                    image: RefInput
                }

                extend type PbPageSettings {
                    social: PbSocialSettings
                }

                extend input PbPageSettingsInput {
                    social: PbSocialSettingsInput
                }
            `,
            resolvers: {
                PbSocialSettings: {
                    image: ({ image }) => {
                        return { __typename: "File", id: image };
                    }
                }
            }
        }
    }
];
