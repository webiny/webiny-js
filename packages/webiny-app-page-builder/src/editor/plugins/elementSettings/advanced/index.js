// @flow
import * as React from "react";
import { getPlugin, getPlugins } from "webiny-plugins";
import {
    ELEMENT_CREATED,
    activateElement,
    togglePlugin
} from "webiny-app-page-builder/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-page-builder/editor/assets/icons/settings.svg";
import AdvancedSettings from "./AdvancedSettings";
import Action from "../components/Action";
import AdvancedAction from "./AdvancedAction";

export default [
    {
        name: "pb-editor-content-element-advanced-settings",
        type: "pb-editor-content",
        render() {
            return <AdvancedSettings />;
        }
    },
    {
        type: "pb-editor-redux-middleware",
        name: "pb-editor-redux-middleware-advanced-settings",
        actions: [ELEMENT_CREATED],
        middleware: ({ store, action, next }: Object) => {
            const { element, source } = action.payload;

            next(action);

            // Check the source of the element (could be `saved` element which behaves differently from other elements)
            const sourcePlugin = getPlugins("pb-page-element").find(
                pl => pl.elementType === source.type
            );
            if (!sourcePlugin) {
                return;
            }
            const { onCreate } = sourcePlugin;
            if (!onCreate || onCreate !== "skip") {
                // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
                const plugin = getPlugins("pb-page-element").find(
                    pl => pl.elementType === element.type
                );
                if (!plugin) {
                    return;
                }
                const { onCreate } = plugin;
                if (onCreate && onCreate === "open-settings") {
                    store.dispatch(activateElement({ element: element.id }));
                    store.dispatch(togglePlugin({ name: "pb-page-element-settings-advanced" }));
                }
            }
        }
    },
    {
        name: "pb-page-element-settings-advanced",
        type: "pb-page-element-settings",
        renderAction() {
            return (
                <AdvancedAction>
                    <Action
                        plugin={this.name}
                        icon={<SettingsIcon />}
                        tooltip={"Advanced settings"}
                    />
                </AdvancedAction>
            );
        }
    }
];
