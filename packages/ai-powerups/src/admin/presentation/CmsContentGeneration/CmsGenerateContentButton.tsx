import React from "react";
import { observer } from "mobx-react-lite";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as ChatIcon } from "@webiny/icons/auto_fix_high.svg";
import { useOpenDialog } from "@webiny/app-admin";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/useModel.js";
import { CMS_GENERATE_CONTENT_DIALOG } from "./CmsGenerateContentDialog.js";
import { useAiPowerUpsSettings } from "~/admin/presentation/AiPowerUpsSettings/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";

export const CmsGenerateContentButton = observer(() => {
    const { openDialog } = useOpenDialog();
    const { settings } = useAiPowerUpsSettings();
    const { model } = useModel();
    const presenter = useContentEntryFormPresenter();

    if (!presenter.vm.canSave) {
        return null;
    }

    if (!settings || settings.providers.presets.length === 0) {
        return null;
    }

    return (
        <IconButton
            variant="ghost"
            icon={<ChatIcon />}
            onClick={() => openDialog(CMS_GENERATE_CONTENT_DIALOG, { modelId: model.modelId })}
        />
    );
});
