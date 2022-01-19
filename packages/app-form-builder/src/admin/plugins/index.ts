import install from "./installation";
import formDetailsPreviewContent from "./formDetails/previewContent";
import formDetailsRevisions from "./formDetails/formRevisions";
import formDetailsSubmissions from "./formDetails/formSubmissions";
import formEditorDefaultBar from "./editor/defaultBar";
import formEditorSettings from "./editor/formSettings";
import permissionRenderer from "./permissionRenderer";

export default () => [
    permissionRenderer(),
    install,
    formDetailsPreviewContent,
    formDetailsRevisions,
    formDetailsSubmissions,
    formEditorDefaultBar,
    formEditorSettings
];
