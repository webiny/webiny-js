// @flow
import * as React from "react";
import { getPlugin } from "webiny-app/plugins";
import { redux, addMiddleware } from "webiny-app-cms/editor/redux";
import { ELEMENT_CREATED, activateElement, togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";
import AdvancedSettings from "./AdvancedSettings";

export default [
    {
        name: "cms-element-advanced-settings",
        type: "cms-editor-content",
        init() {
            addMiddleware([ELEMENT_CREATED], ({ store, action, next }) => {
                const { element, source } = action.payload;

                next(action);

                // Check the source of the element (could be `saved` element which behaves differently from other elements)
                const { onCreate } = getPlugin(source.type);
                if (!onCreate || onCreate !== "skip") {
                    // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
                    const { onCreate } = getPlugin(element.type);
                    if (onCreate && onCreate === "open-settings") {
                        store.dispatch(activateElement({ element: element.id }));
                        store.dispatch(togglePlugin({ name: "cms-element-action-advanced" }));
                    }
                }
            });
        },
        render(props: Object) {
            return <AdvancedSettings {...props} />;
        }
    },
    {
        name: "cms-element-action-advanced",
        type: "cms-element-action",
        render() {
            return (
                <SettingsIcon
                    onClick={() => {
                        redux.store.dispatch(togglePlugin({ name: "cms-element-action-advanced" }));
                    }}
                />
            );
        }
    }
];
