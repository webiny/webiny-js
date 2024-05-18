import React, { useEffect, useCallback, useRef, useMemo } from "react";
import camelCase from "lodash/camelCase";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Tags } from "@webiny/ui/Tags";
import { useForm, Bind } from "@webiny/form";
import { useModelFieldEditor } from "~/admin/components/FieldEditor";
import { useModelEditor } from "~/admin/hooks";
import { useModelField } from "~/admin/hooks";

const GeneralTab = () => {
    const form = useForm();
    const { field, fieldPlugin } = useModelField();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { data: contentModel } = useModelEditor();
    const { getField } = useModelFieldEditor();

    // Had problems with autofocusing the "label" field. A couple of comments on this.
    // 1. It's probably caused by the Tabs component which wraps this component.
    // 2. It seems that the "autoFocus" prop on the Input doesn't work. I can't see it attached in the actual DOM.
    // 3. This works, but it's not 100%. Visually, the cursor is frozen, and that's probably caused by a bug / design
    //    in the RMWC / Material library. If you were to click somewhere on screen, and then apply focus, then
    //    it seems it's behaving correctly. ¯\_(ツ)_/¯
    useEffect(() => {
        setTimeout(() => {
            if (!inputRef.current) {
                return;
            }
            inputRef.current.focus();
        }, /* The value of 400 was determined by manual testing. */ 400);
    }, []);

    const afterChangeLabel = useCallback((value: string) => {
        form.setValue("fieldId", camelCase(value));
    }, []);

    const beforeChangeFieldId = useCallback(
        (value: string, baseOnChange: (value: string) => void) => {
            baseOnChange(value.trim());
        },
        []
    );

    const fieldIdValidator = useCallback((fieldId: string) => {
        if (fieldId.trim().toLowerCase() !== "id") {
            return true;
        }

        throw new Error(`Cannot use "id" as Field ID.`);
    }, []);

    const uniqueFieldIdValidator = useCallback((fieldId: string) => {
        const existingField = getField({ fieldId });
        if (!existingField) {
            return false;
        }

        if (existingField.id === field.id) {
            return true;
        }
        throw new Error("Please enter a unique Field ID.");
    }, []);

    let additionalSettings: React.ReactNode | null = null;
    if (typeof fieldPlugin.field.renderSettings === "function") {
        additionalSettings = fieldPlugin.field.renderSettings({
            afterChangeLabel,
            uniqueFieldIdValidator,
            contentModel
        });
    }

    const predefinedValuesEnabled = useMemo(
        (): boolean =>
            (fieldPlugin.field.allowPredefinedValues || false) &&
            typeof fieldPlugin.field.renderPredefinedValues === "function",
        [field.fieldId]
    );

    return (
        <>
            <Grid>
                <Cell span={6}>
                    <Bind
                        name={"label"}
                        validators={validation.create("required")}
                        afterChange={(value: string) => {
                            if (field.id) {
                                return;
                            }
                            afterChangeLabel(value);
                        }}
                    >
                        <Input
                            label={"Label"}
                            inputRef={inputRef}
                            data-testid="cms.editor.field.settings.general.label"
                        />
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
                        beforeChange={beforeChangeFieldId}
                    >
                        <Input
                            label={"Field ID"}
                            data-testid={`cms.editor.field.settings.general.label-${field.id}`}
                        />
                    </Bind>
                </Cell>

                <Cell span={6}>
                    <Bind name={"multipleValues"}>
                        <Switch
                            label={fieldPlugin.field.multipleValuesLabel}
                            disabled={!fieldPlugin.field.allowMultipleValues}
                            data-testid={`cms.editor.field.settings.general.switch-multiplevalues`}
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"predefinedValues.enabled"}>
                        <Switch
                            label={"Use predefined values"}
                            disabled={!predefinedValuesEnabled}
                            data-testid={`cms.editor.field.settings.general.switch-predefinedvalues`}
                        />
                    </Bind>
                </Cell>

                <Cell span={12}>
                    <Bind name={"helpText"}>
                        <Input
                            label={"Help text"}
                            description={"Help text (optional)"}
                            data-testid={`cms.editor.field.settings.general.helptext`}
                        />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"tags"}>
                        <Tags
                            label={"Tags"}
                            protectedTags={fieldPlugin.field.tags}
                            description={"Field tags (optional)"}
                            data-testid={`cms.editor.field.settings.general.tags`}
                        />
                    </Bind>
                </Cell>
            </Grid>
            {additionalSettings}
        </>
    );
};

export default GeneralTab;
