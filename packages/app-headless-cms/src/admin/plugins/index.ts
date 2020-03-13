import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";

import contentModelEditorPlugins from "../../editor/plugins";

export default [
    routes,
    menus,

    // Editor
    fields,
    groups,
    validators,
    contentModelEditorPlugins
];
