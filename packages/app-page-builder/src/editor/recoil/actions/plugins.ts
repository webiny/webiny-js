import cloneElementPlugin from "./cloneElement/plugin";
import createElementPlugin from "./createElement/plugin";
import deactivatePluginPlugin from "./deactivatePlugin/plugin";
import deleteElementPlugin from "./deleteElement/plugin";
import dragPlugin from "./drag/plugin";
import dropElementPlugin from "./dropElement/plugin";
import togglePluginPlugin from "./togglePlugin/plugin";
import updateElementPlugin from "./updateElement/plugin";
import updateDocument from "./updateDocument/plugin";
import afterDropElementPlugin from "./afterDropElement/plugin";
import moveBlockPlugin from "./moveBlock/plugin";
import afterUpdateElementsPlugin from "./updateElementTree/plugin";

export default () => [
    cloneElementPlugin(),
    createElementPlugin(),
    updateElementPlugin(),
    ...updateDocument(),
    togglePluginPlugin(),
    dropElementPlugin(),
    afterDropElementPlugin(),
    deactivatePluginPlugin(),
    deleteElementPlugin(),
    moveBlockPlugin(),
    afterUpdateElementsPlugin(),
    ...dragPlugin()
];
