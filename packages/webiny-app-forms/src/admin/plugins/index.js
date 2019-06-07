// @flow
import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import richEditor from "./richTextEditor";
import formEditorPlugins from "webiny-app-forms/editor";

import revisionContent from "./formDetails/revisionContent";
import header from "./formDetails/header";
import previewContent from "./formDetails/previewContent";
import pageRevisions from "./formDetails/pageRevisions";
import formSubmissions from "./formDetails/formSubmissions";

export default [
    routes,
    menus,
    fields,
    groups,
    validators,
    richEditor,
    formEditorPlugins,
    revisionContent,
    header,
    formSubmissions,
    previewContent,
    pageRevisions
];
