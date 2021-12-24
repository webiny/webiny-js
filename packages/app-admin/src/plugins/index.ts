import fileManager from "./fileManager";
import uiLayoutRenderer from "./uiLayoutRenderer";
import { globalSearchHotkey } from "./globalSearch";

export default () => [
    fileManager,
    globalSearchHotkey,
    uiLayoutRenderer
];
