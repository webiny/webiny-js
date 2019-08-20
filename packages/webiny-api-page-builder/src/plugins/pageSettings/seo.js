// @flow
import { gql } from "apollo-server-lambda";
import { EntityModel } from "webiny-entity";

class MetaTagModel extends EntityModel {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("content").char();
    }
}

class SeoSettings extends EntityModel {
    constructor() {
        super();
        this.attr("meta").models(MetaTagModel, false);
        this.attr("title").char();
        this.attr("description").char();
    }
}

export default [
    {
        name: "pb-page-settings-seo",
        type: "pb-page-settings-model",
        apply({ model }: { model: EntityModel }) {
            model
                .attr("seo")
                .model(SeoSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "graphql-schema-page-builder-settings-seo",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type PbSeoSettingsMetaTag {
                    name: String
                    content: String
                }

                input PbSeoSettingsMetaTagInput {
                    name: String!
                    content: String!
                }

                type PbSeoSettings {
                    title: String
                    description: String
                    meta: [PbSeoSettingsMetaTag]
                }

                input PbSeoPageSettingsInput {
                    title: String
                    description: String
                    meta: [PbSeoSettingsMetaTagInput]
                }

                extend type PbPageSettings {
                    seo: PbSeoSettings
                }

                extend input PbPageSettingsInput {
                    seo: PbSeoPageSettingsInput
                }
            `
        }
    }
];
