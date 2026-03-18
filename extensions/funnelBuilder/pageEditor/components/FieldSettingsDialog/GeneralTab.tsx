import React, { useCallback, useEffect, useRef } from "react";
import { Grid, Input } from "webiny/admin/ui";
import camelCase from "lodash/camelCase";
import { Bind, useForm } from "webiny/admin/form";
import { required } from "../../../utils/validators";
import { FunnelFieldDefinitionModel } from "../../../models/FunnelFieldDefinitionModel";

interface GeneralTabProps {
    field: FunnelFieldDefinitionModel;
    open: boolean;
}

export const GeneralTab = ({ open }: GeneralTabProps) => {
    const { setValue, data: field } = useForm();

    const { funnelVm } = useContainer();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const afterChangeLabel = useCallback((value: string): void => {
        setValue("fieldId", camelCase(value));
    }, []);

    useEffect(() => {
        setTimeout(() => {
            if (!inputRef.current) {
                return;
            }

            // On dialog open, we focus the first input field.
            if (open) {
                inputRef.current.focus();
            }
        }, 150);
    }, [open]);

    const uniqueFieldIdValidator = useCallback(() => {
        const existingField = funnelVm.getFieldByFieldId(field.fieldId);
        if (!existingField) {
            return true;
        }

        if (existingField.id === field.id) {
            return true;
        }
        throw new Error("A field with this field ID already exists.");
    }, [field.fieldId]);

    const fieldIdValidator = useCallback((fieldId: string) => {
        if (!fieldId) {
            return true;
        }

        if (/^[a-zA-Z0-9_-]*$/.test(fieldId)) {
            return true;
        }
        throw Error('Field ID may contain only letters, numbers and "-" and "_" characters.');
    }, []);

    // const fieldSettingsPlugin = plugins.byType("pb-editor-funnel-field-settings").find(plugin => {
    //     return plugin.fieldType === field.type;
    // }) as Plugin<any>;

    let additionalSettings: React.ReactNode = null;
    // if (fieldSettingsPlugin) {
    // const RendererComponent = fieldSettingsPlugin.renderer;
    // additionalSettings = (
    //     <RendererComponent
    //         afterChangeLabel={afterChangeLabel}
    //         uniqueFieldIdValidator={uniqueFieldIdValidator}
    //     />
    // );
    // }

    return (
        <>
            <Grid>
                <Grid.Column span={6}>
                    <Bind name={"label"} validators={required} afterChange={afterChangeLabel}>
                        <Input label={"Label"} inputRef={inputRef} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Bind
                        name={"fieldId"}
                        validators={[required, uniqueFieldIdValidator, fieldIdValidator]}
                    >
                        <Input label={"Field ID"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"helpText"}>
                        <Input label={"Help text"} description={"Help text (optional)"} />
                    </Bind>
                </Grid.Column>
            </Grid>
            {additionalSettings}
        </>
    );
};
