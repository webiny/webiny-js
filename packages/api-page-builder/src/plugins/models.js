// @flow
import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import pbCategory from "./models/pbCategory.model";
import pbPageElement from "./models/pbPageElement.model";
import pbMenu from "./models/pbMenu.model";
import pbPage from "./models/pbPage.model";
import pbPageCache from "./models/pbPageCache.model";
import pbSettings from "./models/pbSettings.model";

export default () => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = ({ maxPerPage = 100 } = {}) =>
            flow(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver, maxPerPage }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        const PbCategory = pbCategory({ createBase, context });
        const PbMenu = pbMenu({ createBase, context });
        const PbPageElement = pbPageElement({ createBase, context });
        const PbSettings = pbSettings({ createBase, context });
        const PbPage = pbPage({ createBase, context, PbCategory, PbSettings });
        const PbPageCache = pbPageCache({ createBase, context, PbPage, PbSettings });

        context.models = {
            PbCategory,
            PbPageElement,
            PbMenu,
            PbSettings,
            PbPage,
            PbPageCache
        };

        context.plugins.byType("api-page-builder-model").forEach(plugin => {
            plugin.model({ models: context.models, createBase });
        });
    }
});
