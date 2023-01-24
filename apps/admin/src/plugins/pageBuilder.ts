/* Core Page Builder app plugins */
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";

/* Page builder core config */
import pageBuilderConfig from "@webiny/app-page-builder/editor/plugins/pageBuilderConfig";

/* Welcome screen widget for Page Builder */
import welcomeScreenWidget from "@webiny/app-page-builder/admin/plugins/welcomeScreenWidget";

import editorPlugins from "./pageBuilder/editorPlugins";
import renderPlugins from "./pageBuilder/renderPlugins";

export default [
    pageBuilderConfig({
        maxEventActionsNesting: 10
    }),
    pageBuilderPlugins(),
    welcomeScreenWidget,
    editorPlugins,
    renderPlugins
];
