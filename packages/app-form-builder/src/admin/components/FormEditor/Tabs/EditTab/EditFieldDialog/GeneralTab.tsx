import React, { useCallback } from "react";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { camelCase } from "lodash";
import { useFormEditor } from "../../../Context";
import { validation } from "@webiny/validation";
import { FbFormModelField } from "~/types";
import { FormRenderPropParams } from "@webiny/form/types";

type GeneralTabProps = {
    field: FbFormModelField;
    form: FormRenderPropParams;
};

const GeneralTab = ({ field, form }: GeneralTabProps) => {
    const { Bind, setValue } = form;
    const { getField, getFieldPlugin } = useFormEditor();

    const afterChangeLabel = useCallback(value => {
        setValue("fieldId", camelCase(value));
    }, []);

    const uniqueFieldIdValidator = useCallback(fieldId => {
        const existingField = getField({ fieldId });
        if (!existingField) {
            return true;
        }

        if (existingField._id === field._id) {
            return true;
        }
        throw new Error("Please enter a unique Field ID");
    }, undefined);

    const fieldPlugin = getFieldPlugin({ name: field.name });

    let additionalSettings = null;
    if (typeof fieldPlugin.field.renderSettings === "function") {
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
                        validators={[validation.create("required"), uniqueFieldIdValidator]}
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
