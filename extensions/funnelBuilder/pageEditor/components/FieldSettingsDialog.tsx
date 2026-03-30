import React, { useMemo } from "react";
import { Dialog, Tabs } from "webiny/admin/ui";
import { Form } from "webiny/admin/form";
import { GeneralTab } from "./FieldSettingsDialog/GeneralTab";
import { ValidatorsTab } from "./FieldSettingsDialog/ValidatorsTab";
import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../../models/FunnelFieldDefinitionModel";
import { useContainer } from "../useContainer";
import { FunnelContainerInputs } from "@/extensions/funnelBuilder/pageEditor/types";

interface EditFieldDialogProps {
    open: boolean;
    elementId: string | null;
    onClose: () => void;
}

/* Inputs shape for any Fub/Field* element. */
interface FunnelFieldInputs {
    fieldData: FunnelFieldDefinitionModelDto;
}

export const FieldSettingsDialog = ({ open, elementId, onClose }: EditFieldDialogProps) => {
    const { inputs, updateInputs } = useContainer();

    const fieldDataDto = inputs.containerData?.fields.find(f => f.id === elementId)!;
    let fieldDef: null | FunnelFieldDefinitionModel = null;
    if (fieldDataDto) {
        fieldDef = FunnelFieldDefinitionModel.fromDto(fieldDataDto);
    }

    const initialFormData = useMemo(() => {
        if (!fieldDef) {
            return {};
        }
        return fieldDef.toDto();
    }, [fieldDef]);

    const handleSubmit = (data: FunnelFieldDefinitionModelDto) => {
        updateInputs(current => {
            const fieldIndex = current.containerData.fields.findIndex(f => f.id === elementId);
            if (fieldIndex > -1) {
                console.log(
                    "current.containerData.fields[fieldIndex]",
                    current.containerData.fields[fieldIndex]
                );

                current.containerData.fields[fieldIndex] = data;
            }
        });
        onClose();
    };

    return (
        <>
            {fieldDef && (
                <Form<FunnelFieldDefinitionModelDto> data={initialFormData} onSubmit={handleSubmit}>
                    {({ submit }) => (
                        <Dialog
                            style={{ width: 875 }}
                            size={"lg"}
                            bodyPadding={false}
                            open={open}
                            onClose={onClose}
                            title={"Field Settings"}
                            description={"Configure the field settings and validation rules"}
                            actions={
                                <>
                                    <Dialog.CancelAction onClick={onClose} text={"Cancel"} />
                                    <Dialog.ConfirmAction onClick={submit} text={"Save"} />
                                </>
                            }
                        >
                            <div className={"w-[875px] min-h-[400px] max-h-[600px] overflow-auto"}>
                                <Tabs
                                    separator={true}
                                    spacing={"lg"}
                                    tabs={[
                                        <Tabs.Tab
                                            key={"general"}
                                            value={"general"}
                                            trigger={"General"}
                                            content={<GeneralTab field={fieldDef} open={open} />}
                                        />,
                                        <Tabs.Tab
                                            key={"validators"}
                                            value={"validators"}
                                            trigger={"Validators"}
                                            content={<ValidatorsTab field={fieldDef} />}
                                            visible={fieldDef.supportedValidatorTypes.length > 0}
                                        />
                                    ]}
                                />
                            </div>
                        </Dialog>
                    )}
                </Form>
            )}
        </>
    );
};
