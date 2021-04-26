import cloneElementPlugin from "./cloneElement/plugin";
import createElementPlugin from "./createElement/plugin";
import deactivatePluginPlugin from "./deactivatePlugin/plugin";
import deleteElementPlugin from "./deleteElement/plugin";
import dragPlugin from "./drag/plugin";
import dropElementPlugin from "./dropElement/plugin";
import saveRevisionPlugin from "./saveRevision/plugin";
import togglePluginPlugin from "./togglePlugin/plugin";
import updateElementPlugin from "./updateElement/plugin";
import updatePagePlugin from "./updatePage/plugin";
import afterDropElementPlugin from "./afterDropElement/plugin";
import moveBlockPlugin from "./moveBlock/plugin";

export default () => [
    cloneElementPlugin(),
    createElementPlugin(),
    updateElementPlugin(),
    togglePluginPlugin(),
    ...saveRevisionPlugin(),
    dropElementPlugin(),
    afterDropElementPlugin(),
    deactivatePluginPlugin(),
    deleteElementPlugin(),
    updatePagePlugin(),
    moveBlockPlugin(),
    ...dragPlugin()
];
