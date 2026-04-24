import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { GenerateContentButton } from "~/admin/presentation/WbContentGeneration/GenerateContentButton.js";
import {
    GenerateContentDialog,
    GENERATE_CONTENT_DIALOG
} from "~/admin/presentation/WbContentGeneration/GenerateContentDialog.js";
import { GenerateContentFeature } from "~/admin/presentation/WbContentGeneration/feature.js";

export const WbContentGeneration = () => {
    const { Ui } = PageEditorConfig;

    return (
        <>
            <RegisterFeature feature={GenerateContentFeature} />
            <AdminConfig>
                <AdminConfig.Dialog
                    name={GENERATE_CONTENT_DIALOG}
                    element={<GenerateContentDialog />}
                />
            </AdminConfig>
            <PageEditorConfig>
                <Ui.TopBar.Action
                    name={"generateContent"}
                    before={"revisionsMenu"}
                    element={
                        <Ui.IsNotReadOnly>
                            <GenerateContentButton />
                        </Ui.IsNotReadOnly>
                    }
                />
            </PageEditorConfig>
        </>
    );
};
