import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useWcp } from "@webiny/app-admin";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/useModel.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsEntryWizard } from "./CmsEntryWizard.js";

export const CmsEntryWizardGate = observer(() => {
    const wcp = useWcp();
    const { model } = useModel();
    const formPresenter = useContentEntryFormPresenter();

    /**
     * The AI wizard depends on the CMS content generation feature, which is only registered
     * when the license allows AI entry generation.
     */
    const showWizard = model.settings?.aiEntryWizard === true && wcp.canUseAiEntryGeneration();

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
