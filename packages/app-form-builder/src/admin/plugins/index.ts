import routes from "./routes";
import menus from "./menus";
import install from "./installation";
import settings from "./settings";
import formDetailsPreviewContent from "./formDetails/previewContent";
import formDetailsRevisions from "./formDetails/formRevisions";
import formDetailsSubmissions from "./formDetails/formSubmissions";
import formEditorDefaultBar from "./editor/defaultBar";
import formEditorSettings from "./editor/formSettings";

export default () => [
    install,
    settings,
    routes,
    menus,
    formDetailsPreviewContent,
    formDetailsRevisions,
    formDetailsSubmissions,
    formEditorDefaultBar,
    formEditorSettings
];
