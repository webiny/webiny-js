import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import validators from "./validators";
import icons from "./icons";
import install from "./install";
// import header from "./contentDetails/header";
import revisionContent from "./contentDetails/revisionContent";
import previewContent from "./contentDetails/contentForm";
import header from "./contentDetails/header";

import contentModelEditorPlugins from "./../editor/plugins";

export default [
    install,
    routes,
    menus,
    icons,

    header,
    revisionContent,
    previewContent,
    // pageRevisions,

    // Editor.
    fields,
    validators,
    contentModelEditorPlugins
];
