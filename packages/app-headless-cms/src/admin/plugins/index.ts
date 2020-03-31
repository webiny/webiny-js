import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import icons from "./icons";

import contentModelEditorPlugins from "../../editor/plugins";

export default [
    routes,
    menus,
    icons,

    // Editor
    fields,
    groups,
    validators,
    contentModelEditorPlugins
];
