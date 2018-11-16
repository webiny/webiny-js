// @flow
import type { EntityModel } from "webiny-entity";

export default [
    {
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
        apply(model: EntityModel) {
            model.attr("description").char();
            model.attr("tags").array();
            model.attr("layout").array();
        }
    },
    {
        name: "cms-schema-settings-general",
        type: "cms-schema",
        typeDefs: `
            extend type PageSettings {
                description: String
                tags: [String]
                layout: String
            }
        `,
        resolvers: {
            PageSettings: {
                description: () => "Custom description"
            }
        }
    }
];
