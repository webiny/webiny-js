import React from "react";
import { Button, useDisclosure } from "webiny/admin/ui";
import { ElementInputs } from "webiny/admin/website-builder/page/editor";
import { useElementInputs } from "webiny/admin/website-builder/page/editor";
import { useComponent } from "webiny/admin/website-builder/page/editor";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { FieldSettingsDialog } from "../components/FieldSettingsDialog";
import { FunnelFieldDefinitionModel } from "../../models/FunnelFieldDefinitionModel";
import type { FunnelFieldDefinitionModelDto } from "../../models/FunnelFieldDefinitionModel";
import type { FunnelModelDto } from "../../models/FunnelModel";

/* Inputs shape for the Fub/Container element. */
interface FunnelContainerInputs {
    registry: FunnelModelDto;
    steps: React.ReactNode[];
    activeStep: number;
}

/* Inputs shape for any Fub/Field* element. */
type FunnelFieldInputs = FunnelFieldDefinitionModelDto;

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

        const {
            open: showFieldSettingsDialog,
            close: hideFieldSettingsDialog,
            isOpen: isFieldSettingsDialogOpen,
            data: selectedField
        } = useDisclosure<FunnelFieldDefinitionModel>();

        if (!element.component.name.startsWith("Fub/")) {
            return <Original {...props} />;
        }

        if (isFunnelContainerElement(element)) {
            /* Container element: inputs are typed as FunnelContainerInputs.
               No field settings dialog needed for the container itself. */
            const containerInputs = inputs as unknown as FunnelContainerInputs;
            void containerInputs;
            return <Original {...props} />;
        }

        if (!isFunnelFieldElement(element)) {
            return <Original {...props} />;
        }

        /* Field element: inputs are typed as FunnelFieldInputs. */
        const handleClick = () => {
            const fieldDto = inputs as unknown as FunnelFieldInputs;
            const field = FunnelFieldDefinitionModel.fromDto(fieldDto);
            showFieldSettingsDialog(field);
        };

        const handleSubmit = (data: FunnelFieldDefinitionModelDto) => {
            updateInputs(current => {
                Object.assign(current, data);
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
