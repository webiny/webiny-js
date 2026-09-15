import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/useModel.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsEntryWizard } from "./CmsEntryWizard.js";

export const CmsEntryWizardGate = observer(() => {
    const { model } = useModel();
    const formPresenter = useContentEntryFormPresenter();

    const showWizard = model.settings?.aiEntryWizard === true;

    useEffect(() => {
        if (!showWizard) {
            formPresenter.newEntry();
        }
    }, [showWizard]);

    return <CmsEntryWizard />;
});
