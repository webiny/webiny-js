import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Actions, ActionsConfig } from "./Actions";
import { FieldElement } from "./FieldElement";

const base = createConfigurableComponent<ContentEntryEditorConfig>("ContentEntryEditorConfig");

export const ContentEntryEditorConfig = Object.assign(base.Config, { Actions, FieldElement });

export const ContentEntryEditorWithConfig = base.WithConfig;

interface ContentEntryEditorConfig {
    actions: ActionsConfig;
}

export function useContentEntryEditorConfig() {
    const config = base.useConfig();

    const actions = config.actions || [];

    return useMemo(
        () => ({
            buttonActions: [...(actions.filter(action => action.$type === "button-action") || [])],
            menuItemActions: [
                ...(actions.filter(action => action.$type === "menu-item-action") || [])
            ]
        }),
        [config]
    );
}
