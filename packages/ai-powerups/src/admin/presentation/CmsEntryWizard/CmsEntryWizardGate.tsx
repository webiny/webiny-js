import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeatureFlags } from "@webiny/app-admin";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/useModel.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsEntryWizard } from "./CmsEntryWizard.js";

export const CmsEntryWizardGate = observer(() => {
    const featureFlags = useFeatureFlags();
    const { model } = useModel();
    const formPresenter = useContentEntryFormPresenter();

    /**
     * The AI wizard depends on the CMS content generation feature, which is only registered
     * when AI entry generation is enabled.
     */
    const showWizard =
        model.settings?.aiEntryWizard === true &&
        featureFlags.isEnabled("aiPowerups.cms.entryGeneration");

    useEffect(() => {
        if (!showWizard) {
            formPresenter.newEntry();
        }
    }, [showWizard]);

    if (!showWizard) {
        return null;
    }

    return <CmsEntryWizard />;
});
