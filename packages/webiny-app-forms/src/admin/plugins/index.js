// @flow
import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import settings from "./settings";

import formEditorPlugins from "webiny-app-forms/editor/plugins";
import formSitePlugins from "webiny-app-forms/site/plugins";

import revisionContent from "./formDetails/revisionContent";
import previewContent from "./formDetails/previewContent";
import formRevisions from "./formDetails/formRevisions";
import formSubmissions from "./formDetails/formSubmissions";

export default [
    settings,
    routes,
    menus,
    revisionContent,
    formSubmissions,
    previewContent,
    formRevisions,

    // Editor
    fields,
    groups,
    validators,
    formEditorPlugins,
    formSitePlugins
];
