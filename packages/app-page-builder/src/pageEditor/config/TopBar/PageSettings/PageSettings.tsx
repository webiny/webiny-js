import React from "react";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";

/* For the time being, we're importing from the base editor, to not break things for existing users. */
import { PageSettingsView } from "~/editor/ui/views/PageSettingsView";

import { usePageSettings } from "./usePageSettings";

export const PageSettingsOverlay = () => {
    const { isOpen } = usePageSettings();

    return isOpen ? <UIViewComponent view={new PageSettingsView()} /> : null;
};
