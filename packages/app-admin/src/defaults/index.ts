import fileManager from "./fileManager";
import menu from "./menu";
import userMenu from "./userMenu";
import { globalSearch, globalSearchHotkey } from "./globalSearch";

export default () => [
    menu,
    fileManager,
    userMenu,
    globalSearch,
    globalSearchHotkey
];
