import fileManagerPermissionRenderer from "./FileManagerPermission";
import filePermissionRenderer from "./FilesPermission";
import settingsPermissionRenderer from "./SettingsPermission";

export default () => [
    filePermissionRenderer,
    settingsPermissionRenderer,
    fileManagerPermissionRenderer
];
