import installation from "./installation";
import menus from "./menus";
import fileManagerPermission from "./permissionRenderer/fileManagerPermission";
import filesPermission from "./permissionRenderer/filesPermission";
import settingsPermission from "./permissionRenderer/settingsPermission";

export default () => [
    installation,
    menus,
    fileManagerPermission,
    filesPermission,
    settingsPermission
];
