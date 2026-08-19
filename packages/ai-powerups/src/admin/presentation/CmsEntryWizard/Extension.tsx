import React from "react";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { CmsEntryWizardGate } from "./CmsEntryWizardGate.js";

export const CmsEntryWizardExtension = () => {
    return (
        <InternalContentEntryEditorConfig>
            <InternalContentEntryEditorConfig.NewEntryWizard
                name={"aiEntryWizard"}
                element={<CmsEntryWizardGate />}
            />
        </InternalContentEntryEditorConfig>
    );
};
