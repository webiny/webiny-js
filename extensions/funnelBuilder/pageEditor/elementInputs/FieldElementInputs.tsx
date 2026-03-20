import React from "react";
import { Button, useDisclosure } from "webiny/admin/ui";
import {
    ElementInputs,
    useComponent,
    useElementInputs
} from "webiny/admin/website-builder/page/editor";
import { FieldSettingsDialog } from "../components/FieldSettingsDialog";
import type { FunnelFieldDefinitionModelDto } from "../../models/FunnelFieldDefinitionModel";
import { FunnelFieldDefinitionModel } from "../../models/FunnelFieldDefinitionModel";

/* Inputs shape for any Fub/Field* element. */
interface FunnelFieldInputs {
    fieldData: FunnelFieldDefinitionModelDto;
}

export const FieldElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function FieldElementSettings(props) {
        const { element } = props;
        const { inputs, updateInputs } = useElementInputs(element.id);
        const component = useComponent(element.component.name);

        const {
            open: showFieldSettingsDialog,
            close: hideFieldSettingsDialog,
            isOpen: isFieldSettingsDialogOpen,
            data: selectedField
        } = useDisclosure<FunnelFieldDefinitionModel>();

        if (!element.component.name.startsWith("Fub/Field/")) {
            return <Original {...props} />;
        }

        /* Field element: inputs are typed as FunnelFieldInputs. */
        const handleClick = () => {
            const { fieldData } = inputs as unknown as FunnelFieldInputs;
            const field = FunnelFieldDefinitionModel.fromDto(fieldData);
            showFieldSettingsDialog(field);
        };

        const handleSubmit = (data: FunnelFieldDefinitionModelDto) => {
            updateInputs(current => {
                (current as unknown as FunnelFieldInputs).fieldData = data;
            });
            hideFieldSettingsDialog();
        };

        return (
            <>
                <Button
                    variant={"primary"}
                    text={`Edit ${component.label} Settings`}
                    className={"w-full"}
                    onClick={handleClick}
                />
                <FieldSettingsDialog
                    open={isFieldSettingsDialogOpen}
                    field={selectedField!}
                    onClose={hideFieldSettingsDialog}
                    onSubmit={handleSubmit}
                />
            </>
        );
    };
});
