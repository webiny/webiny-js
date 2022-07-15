import { memo } from "react";
import { plugins } from "@webiny/plugins";

import cloneElementPlugin from "../recoil/actions/cloneElement/plugin";
import createElementPlugin from "../recoil/actions/createElement/plugin";
import deactivatePluginPlugin from "../recoil/actions/deactivatePlugin/plugin";
import deleteElementPlugin from "../recoil/actions/deleteElement/plugin";
import dragPlugin from "../recoil/actions/drag/plugin";
import dropElementPlugin from "../recoil/actions/dropElement/plugin";
import togglePluginPlugin from "../recoil/actions/togglePlugin/plugin";
import updateElementPlugin from "../recoil/actions/updateElement/plugin";
import afterDropElementPlugin from "../recoil/actions/afterDropElement/plugin";
import moveBlockPlugin from "../recoil/actions/moveBlock/plugin";
import afterUpdateElementsPlugin from "../recoil/actions/updateElementTree/plugin";
import elementSettingsPlugin from "../plugins/elementSettings/advanced/plugin";

export const ActionPlugins = memo(() => {
    plugins.register([
        cloneElementPlugin(),
        createElementPlugin(),
        updateElementPlugin(),
        togglePluginPlugin(),
        dropElementPlugin(),
        afterDropElementPlugin(),
        deactivatePluginPlugin(),
        deleteElementPlugin(),
        moveBlockPlugin(),
        afterUpdateElementsPlugin(),
        ...dragPlugin(),
        elementSettingsPlugin
    ]);

    return null;
});

ActionPlugins.displayName = "ActionPlugins";
