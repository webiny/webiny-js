// @flow
import { flow } from "lodash";
import { withStorage } from "@webiny/commodo";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { withUser } from "@webiny/api-security";

import pbCategory from "./models/pbCategory.model";
import pbPageElement from "./models/pbPageElement.model";
import pbMenu from "./models/pbMenu.model";
import pbPage from "./models/pbPage.model";
import pbSettings from "./models/pbSettings.model";

export default ({ database }) => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = new MongoDbDriver({
            database: database.mongodb
        });

        const createBase = ({ maxPerPage = 100 } = {}) =>
            flow(
                withId(),
                withStorage({ driver, maxPerPage }),
                withUser(context)
            )();

        const PbCategory = pbCategory({ createBase });
        const PbMenu = pbMenu({ createBase });
        const PbPageElement = pbPageElement({ createBase, context });
        const PbSettings = pbSettings({ createBase, context });
        const PbPage = pbPage({ createBase, context, PbCategory, PbSettings });

        context.models = {
            PbCategory,
            PbPageElement,
            PbMenu,
            PbSettings,
            PbPage
        };

        context.plugins.byType("api-page-builder-model").forEach(plugin => {
            plugin.model({ models: context.models, createBase });
        });
    }
});
