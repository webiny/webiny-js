import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { GenerateContentButton } from "~/admin/presentation/WbContentGeneration/GenerateContentButton.js";

export const WbContentGeneration = () => {
    const { Ui } = PageEditorConfig;

    return (
        <>
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
