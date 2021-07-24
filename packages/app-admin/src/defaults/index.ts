import fileManager from "./fileManager";
import settingsMenu from "./settingsMenu";
import menu from "./menu";
import userMenu from "./userMenu";
import { globalSearch, globalSearchHotkey } from "./globalSearch";
import defaultHandle from "./userMenu/defaultHandle";

export default () => [
    menu,
    fileManager,
    settingsMenu,
    userMenu,
    globalSearch,
    globalSearchHotkey,
    defaultHandle
];
