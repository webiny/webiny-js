import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { ContainerElementInputsDecorator } from "./ContainerElementInputs";
import { ButtonElementInputsDecorator } from "./button/ButtonElementInputs.js";
import { FieldElementSettings } from "./FieldSettingsDialog.js";
import { FieldSettingsButton } from "./FieldSettingsButton.js";

const { Ui } = PageEditorConfig;

export const FubElementInputs = () => {
    return (
        <>
            <ContainerElementInputsDecorator />
            <ButtonElementInputsDecorator />
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
