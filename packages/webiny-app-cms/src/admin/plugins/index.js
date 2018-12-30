// @flow
import header from "./pageDetails/header";
import revisionContent from "./pageDetails/revisionContent";
import previewContent from "./pageDetails/previewContent";
import pageRevisions from "./pageDetails/pageRevisions";
import icons from "./icons";
import menuItems from "./menuItems";
import globalSearch from "./globalSearch";
import settings from "./settings";
import editorPlugins from "webiny-app-cms/editor/presets/default";
import renderPlugins from "webiny-app-cms/render/presets/default";
import routes from "./routes";
import menus from "./menus";

export default [
    header,
    revisionContent,
    previewContent,
    pageRevisions,
    icons,
    menuItems,
    globalSearch,
    settings,
    editorPlugins,
    renderPlugins,
    routes,
    menus
];
