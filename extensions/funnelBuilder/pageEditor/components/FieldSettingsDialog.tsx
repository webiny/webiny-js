import React, { useMemo } from "react";
import { Dialog, Tabs } from "webiny/admin/ui";
import { Form, FormOnSubmit } from "webiny/admin/form";
import { GeneralTab } from "./FieldSettingsDialog/GeneralTab";
import { ValidatorsTab } from "./FieldSettingsDialog/ValidatorsTab";
import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../../models/FunnelFieldDefinitionModel";

interface EditFieldDialogProps {
    field: FunnelFieldDefinitionModel;
    onClose: () => void;
    open: boolean;
    onSubmit: FormOnSubmit<FunnelFieldDefinitionModelDto>;
}

export const FieldSettingsDialog = ({ field, open, onClose, onSubmit }: EditFieldDialogProps) => {
    const initialFormData = useMemo(() => {
        if (!field) {
            return {};
        }
        return field.toDto();
    }, [field]);

    return (
        <>
            {field && (
                <Form<FunnelFieldDefinitionModelDto> data={initialFormData} onSubmit={onSubmit}>
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
                                            content={<GeneralTab field={field} open={open} />}
                                        />,
                                        <Tabs.Tab
                                            key={"validators"}
                                            value={"validators"}
                                            trigger={"Validators"}
                                            content={<ValidatorsTab field={field} />}
                                            visible={field.supportedValidatorTypes.length > 0}
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
