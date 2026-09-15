import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { ActionsConfig } from "./Actions/index.js";
import { Actions } from "./Actions/index.js";
import { Width } from "./Width.js";
import { NewEntryWizard } from "./NewEntryWizard.js";
import type { NewEntryWizardConfig } from "./NewEntryWizard.js";

const base = createConfigurableComponent<ContentEntryEditorConfig>("ContentEntryEditorConfig");

const InternalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <base.Config priority={"primary"}>{children}</base.Config>;
};

const PublicEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <base.Config priority={"secondary"}>{children}</base.Config>;
};

PublicEditorConfig.displayName = "ContentEntryEditorConfig";

export const ContentEntryEditorConfig = Object.assign(PublicEditorConfig, {
    Actions,
    Width,
    NewEntryWizard
});

export const InternalContentEntryEditorConfig = Object.assign(InternalEditorConfig, {
    Actions,
    Width,
    NewEntryWizard
});

export const ContentEntryEditorWithConfig = base.WithConfig;

interface ContentEntryEditorConfig {
    actions: ActionsConfig;
    width: string;
    newEntryWizards: NewEntryWizardConfig[];
}

export function useContentEntryEditorConfig() {
    const config = base.useConfig();

    const actions = config.actions || [];
    const wizards = (config.newEntryWizards as NewEntryWizardConfig[]) || [];

    return useMemo(
        () => ({
            buttonActions: [...(actions.filter(action => action.$type === "button-action") || [])],
            menuItemActions: [
                ...(actions.filter(action => action.$type === "menu-item-action") || [])
            ],
            width: config.width !== undefined ? config.width : "1020px",
            newEntryWizard: wizards.at(-1)?.element ?? null
        }),
        [config]
    );
}
