import React, { useCallback } from "react";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { camelCase } from "lodash";
import { useFormEditor } from "../../../Context";
import { validation } from "@webiny/validation";
import { Validator } from "@webiny/validation/types";
import { FbFormModelField } from "~/types";
import { FormRenderPropParams } from "@webiny/form/types";

interface GeneralTabProps {
    field: FbFormModelField;
    form: FormRenderPropParams;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ field, form }) => {
    const { Bind, setValue } = form;
    const { getField, getFieldPlugin } = useFormEditor();

    const afterChangeLabel = useCallback((value: string): void => {
        setValue("fieldId", camelCase(value));
    }, []);

    const uniqueFieldIdValidator = useCallback((fieldId: string): boolean => {
        const existingField = getField({ fieldId });
        if (!existingField) {
            return true;
        }

        if (existingField._id === field._id) {
            return true;
        }
        throw new Error("Please enter a unique Field ID");
    }, []);

    const fieldIdValidator: Validator = (value: string | undefined) => {
        if (!value) {
            return true;
        }

        if (/^[a-zA-Z0-9_-]*$/.test(value)) {
            return true;
        }

        throw Error(
            'Field ID can only contain letters, numbers and chars ("-", "_") without any spaces.'
        );
    };

    const fieldPlugin = getFieldPlugin({ name: field.name });

    let additionalSettings: React.ReactNode = null;
    if (fieldPlugin && typeof fieldPlugin.field.renderSettings === "function") {
        additionalSettings = fieldPlugin.field.renderSettings({
            form,
            afterChangeLabel,
            uniqueFieldIdValidator
        });
    }

    return (
        <>
            <Grid>
                <Cell span={6}>
                    <Bind
                        name={"label"}
                        validators={validation.create("required")}
                        afterChange={afterChangeLabel}
                    >
                        <Input label={"Label"} autoFocus={true} />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind
                        name={"fieldId"}
                        validators={[
                            validation.create("required"),
                            uniqueFieldIdValidator,
                            fieldIdValidator
                        ]}
                    >
                        <Input label={"Field ID"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"helpText"}>
                        <Input label={"Help text"} description={"Help text (optional)"} />
                    </Bind>
                </Cell>
            </Grid>
            {additionalSettings}
        </>
    );
};

export default GeneralTab;
