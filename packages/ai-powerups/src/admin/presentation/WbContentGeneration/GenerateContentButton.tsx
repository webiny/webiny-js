import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as ChatIcon } from "@webiny/icons/auto_fix_high.svg";
import { useOpenDialog } from "@webiny/app-admin";
import { GENERATE_CONTENT_DIALOG } from "./GenerateContentDialog.js";
import {
    hasUsableModel,
    useAiPowerUpsSettings
} from "~/admin/presentation/AiPowerUpsSettings/index.js";

export const GenerateContentButton = () => {
    const { openDialog } = useOpenDialog();
    const { settings } = useAiPowerUpsSettings();

    if (!hasUsableModel(settings)) {
        return null;
    }

    return (
        <IconButton
            variant="ghost"
            icon={<ChatIcon />}
            onClick={() => openDialog(GENERATE_CONTENT_DIALOG, {})}
        />
    );
};
