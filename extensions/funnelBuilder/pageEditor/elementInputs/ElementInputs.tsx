import React from "react";
import { Button, useDisclosure } from "webiny/admin/ui";
import { ElementInputs } from "webiny/admin/website-builder/page/editor";
import { useElementInputs } from "webiny/admin/website-builder/page/editor";
import { useComponent } from "webiny/admin/website-builder/page/editor";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { FieldSettingsDialog } from "../components/FieldSettingsDialog";
import { FunnelFieldDefinitionModel } from "../../models/FunnelFieldDefinitionModel";
import type { FunnelFieldDefinitionModelDto } from "../../models/FunnelFieldDefinitionModel";
import type { FunnelContainerInputs } from "../types";

/* Inputs shape for any Fub/Field* element. */
interface FunnelFieldInputs {
    fieldData: FunnelFieldDefinitionModelDto;
}

/* Narrows a DocumentElement to the Fub/Container component. */
function isFunnelContainerElement(
    element: DocumentElement
): element is DocumentElement & { component: { name: "Fub/Container" } } {
    return element.component.name === "Fub/Container";
}

/* Narrows a DocumentElement to any Fub/ field component. */
function isFunnelFieldElement(
    element: DocumentElement
): element is DocumentElement & { component: { name: string } } {
    return (
        element.component.name.startsWith("Fub/") &&
        element.component.name !== "Fub/Container" &&
        element.component.name !== "Fub/Step"
    );
}

export const ElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function FunnelElementSettings(props) {
        const { element } = props;
        const { inputs, updateInputs } = useElementInputs(element.id);
        const component = useComponent(element.component.name);

        if (!element.component.name.startsWith("Fub/")) {
        }

        const {
            open: showFieldSettingsDialog,
            close: hideFieldSettingsDialog,
            isOpen: isFieldSettingsDialogOpen,
            data: selectedField
        } = useDisclosure<FunnelFieldDefinitionModel>();

        if (isFunnelContainerElement(element)) {
            /* Container element: inputs are typed as FunnelContainerInputs.
               No field settings dialog needed for the container itself. */
            const containerInputs = inputs as unknown as FunnelContainerInputs;
            void containerInputs;
            return <Original {...props} />;
        }

        if (isFunnelFieldElement(element)) {
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
        }

        return <Original {...props} />;
    };
});
