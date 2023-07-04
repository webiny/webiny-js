import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Actions, ActionsConfig } from "./Actions";

const base = createConfigurableComponent<ContentEntryEditorConfig>("ContentEntryEditorConfig");

export const ContentEntryEditorConfig = Object.assign(base.Config, { Actions });

export const ContentEntryEditorWithConfig = base.WithConfig;

interface ContentEntryEditorConfig {
    actions: ActionsConfig;
}

export function useContentEntryEditorConfig() {
    const config = base.useConfig();

    const actions = config.actions || [];

    return useMemo(
        () => ({
            actions: [...(actions || [])]
        }),
        [config]
    );
}
