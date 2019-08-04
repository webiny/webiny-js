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
        name: "cms-page-settings-social",
        type: "cms-page-settings-model",
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
                type PageBuilderOpenGraphTag {
                    property: String
                    content: String
                }

                type PageBuilderSocialSettings {
                    title: String
                    description: String
                    meta: [PageBuilderOpenGraphTag]
                    image: File
                }

                extend type PageBuilderPageSettings {
                    social: PageBuilderSocialSettings
                }
            `,
            resolvers: {
                PageBuilderSocialSettings: {
                    image: ({ image }) => {
                        return { __typename: "File", id: image };
                    }
                }
            }
        }
    }
];
