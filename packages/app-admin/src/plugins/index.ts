import fileManager from "./fileManager";
import userMenu from "./userMenu";
import uiLayoutRenderer from "./uiLayoutRenderer";
import { globalSearchHotkey } from "./globalSearch";

export default () => [
    fileManager,
    userMenu,
    globalSearchHotkey,
    uiLayoutRenderer
];
