import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import validators from "./validators";
import icons from "./icons";
import install from "./install";
import revisionContent from "./contentDetails/revisionContent";
import contentForm from "./contentDetails/contentForm";
import header from "./contentDetails/header";
import contentRevisions from "./contentDetails/contentRevisions";

import contentModelEditorPlugins from "./../editor/plugins";

export default [
    install,
    routes,
    menus,
    icons,

    header,
    revisionContent,
    contentForm,
    contentRevisions,

    // Editor.
    fields,
    validators,
    contentModelEditorPlugins
];
