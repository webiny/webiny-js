import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { ContainerElementInputsDecorator } from "./ContainerElementInputs";
import { FieldElementSettings } from "./FieldSettingsDialog.js";
import { FieldSettingsButton } from "./FieldSettingsButton.js";

const { Ui } = PageEditorConfig;

export const FubElementInputs = () => {
    return (
        <>
            <ContainerElementInputsDecorator />
            <FieldSettingsButton />
            <PageEditorConfig>
                <Ui.Content.Element
                    name={"fieldSettingsDialog"}
                    element={<FieldElementSettings />}
                />
            </PageEditorConfig>
        </>
    );
};
