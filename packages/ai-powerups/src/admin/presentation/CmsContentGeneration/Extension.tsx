import React from "react";
import { AdminConfig, RegisterFeature, useWcp } from "@webiny/app-admin";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { CmsGenerateContentButton } from "~/admin/presentation/CmsContentGeneration/CmsGenerateContentButton.js";
import {
    CmsGenerateContentDialog,
    CMS_GENERATE_CONTENT_DIALOG
} from "~/admin/presentation/CmsContentGeneration/CmsGenerateContentDialog.js";
import { CmsGenerateContentFeature } from "~/admin/presentation/CmsContentGeneration/feature.js";
import { GenerateEntryContentFeature } from "~/admin/features/generateEntryContent/index.js";

const { Actions } = ContentEntryEditorConfig;

export const CmsContentGeneration = () => {
    const wcp = useWcp();

    if (!wcp.canUseAiEntryGeneration()) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={CmsGenerateContentFeature} />
            <RegisterFeature feature={GenerateEntryContentFeature} />
            <AdminConfig>
                <AdminConfig.Dialog
                    name={CMS_GENERATE_CONTENT_DIALOG}
                    element={<CmsGenerateContentDialog />}
                />
            </AdminConfig>
            <ContentEntryEditorConfig>
                <Actions.ButtonAction
                    name={"generateEntryContent"}
                    before={"save"}
                    element={<CmsGenerateContentButton />}
                />
            </ContentEntryEditorConfig>
        </>
    );
};
