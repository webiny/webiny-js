// @flow
import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import richEditor from "./richTextEditor";

import formEditorPlugins from "webiny-app-forms/editor/plugins";
import formSitePlugins from "webiny-app-forms/site/plugins";

import revisionContent from "./formDetails/revisionContent";
import header from "./formDetails/header";
import previewContent from "./formDetails/previewContent";
import pageRevisions from "./formDetails/pageRevisions";
import formSubmissions from "./formDetails/formSubmissions";

export default [
    routes,
    menus,
    header,
    revisionContent,
    formSubmissions,
    previewContent,
    pageRevisions,

    // Editor
    fields,
    groups,
    validators,
    richEditor,
    formEditorPlugins,
    formSitePlugins
];
