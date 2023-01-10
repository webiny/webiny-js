import { PbPageElementPagesListComponentPlugin } from "~/types";
import { createPagesList } from "@webiny/app-page-builder-elements/renderers/pagesList";
import { createDefaultDataLoader } from "@webiny/app-page-builder-elements/renderers/pagesList/dataLoaders";
import { plugins } from "@webiny/plugins";
import { getTenantId } from "~/utils";

const PePagesList = createPagesList({
    dataLoader: createDefaultDataLoader({
        apiUrl: process.env.REACT_APP_API_URL + "/graphql",
        includeHeaders: {
            "x-tenant": getTenantId()
        }
    }),
    pagesListComponents: () => {
        const registeredPlugins = plugins.byType<PbPageElementPagesListComponentPlugin>(
            "pb-page-element-pages-list-component"
        );

        return registeredPlugins.map(plugin => {
            return {
                id: plugin.componentName,
                name: plugin.title,
                component: plugin.component
            };
        });
    }
});

export default PePagesList;
