import routes from "./routes";
import menus from "./menus";
import fields from "./fields";
import groups from "./groups";
import validators from "./validators";
import settings from "./settings";

import formEditorPlugins from "@webiny/app-form-builder/editor/plugins";
import formSitePlugins from "@webiny/app-form-builder/site/plugins";

import previewContent from "./formDetails/previewContent";
import formRevisions from "./formDetails/formRevisions";
import formSubmissions from "./formDetails/formSubmissions";
import install from "./install";
import scopesList from "./scopesList";
import welcomeScreenWidget from "./welcomeScreenWidget";

export default () => [
    // Admin modules
    install,
    settings,
    routes,
    menus,
    formSubmissions,
    previewContent,
    formRevisions,
    scopesList,

    // Form Editor
    fields,
    groups,
    validators,
    formEditorPlugins,
    formSitePlugins(),
    
    // Admin welcome screen widget
    welcomeScreenWidget
];
