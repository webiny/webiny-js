import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import validators from "./validators";
import icons from "./icons";

// import header from "./contentDetails/header";
import revisionContent from "./contentDetails/revisionContent";
import previewContent from "./contentDetails/contentForm";
import header from "./contentDetails/header";
import pageRevisions from "./contentDetails/pageRevisions";

import contentModelEditorPlugins from "./../editor/plugins";

export default [
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
