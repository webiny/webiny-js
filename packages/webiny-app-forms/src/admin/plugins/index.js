// @flow
import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import richEditor from "./richTextEditor";
import formEditorPlugins from "webiny-app-forms/editor"

export default [routes, menus, fields, groups, validators, richEditor, formEditorPlugins];
