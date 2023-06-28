import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Form, FormConfig } from "./Form";

const base = createConfigurableComponent<ContentEntryEditorConfig>("ContentEntryEditorConfig");

export const ContentEntryEditorConfig = Object.assign(base.Config, { Form });

export const ContentEntryEditorWithConfig = base.WithConfig;

interface ContentEntryEditorConfig {
    form: FormConfig;
}

export function useContentEntryEditorConfig() {
    const config = base.useConfig();

    const form = config.form || {};

    return useMemo(
        () => ({
            form: { ...form, actions: [...(form.actions || [])] }
        }),
        [config]
    );
}
