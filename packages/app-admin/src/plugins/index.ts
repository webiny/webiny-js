import fileManager from "./fileManager";
import settingsMenu from "./settingsMenu";
import adminLayout from "./adminLayout";
import snackbar from "./snackbar";
import dialog from "./dialog";
import menu from "./menu";
import userMenu from "./userMenu";
import { globalSearch, globalSearchHotkey } from "./globalSearch";
import defaultHandle from "./userMenu/defaultHandle";

export default [
    fileManager,
    settingsMenu,
    adminLayout,
    snackbar,
    dialog,
    menu,
    userMenu,
    globalSearch,
    globalSearchHotkey,
    defaultHandle
];
