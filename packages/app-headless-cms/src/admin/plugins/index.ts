import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import icons from "./icons";
import environmentSelector from "./environmentSelector";

import contentModelEditorPlugins from "../../editor/plugins";

export default [
    routes,
    menus,
    icons,
    environmentSelector,

    // Editor
    fields,
    groups,
    validators,
    contentModelEditorPlugins
];
