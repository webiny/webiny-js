import React, { useEffect, useCallback, useRef, useMemo } from "react";
import camelCase from "lodash/camelCase.js";
import { Grid, Switch, Input, Label, Textarea, FormComponentLabel } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import { Tags } from "@webiny/ui/Tags/index.js";
import { useForm, Bind } from "@webiny/form";
import { useModelFieldEditor } from "~/admin/components/FieldEditor/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { useModelField } from "~/admin/hooks/index.js";

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
            <Grid gap={"comfortable"}>
                <Grid.Column span={6}>
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
                            size={"lg"}
                            inputRef={inputRef}
                            data-testid="cms.editor.field.settings.general.label"
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={6}>
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
                            size={"lg"}
                            data-testid={`cms.editor.field.settings.general.label-${field.id}`}
                        />
                    </Bind>
                </Grid.Column>

                <Grid.Column span={6}>
                    <Bind name={"list"}>
                        <Switch
                            label={fieldPlugin.field.listLabel}
                            disabled={!fieldPlugin.field.allowList}
                            data-testid={`cms.editor.field.settings.general.switch-multiplevalues`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Bind name={"predefinedValues.enabled"}>
                        <Switch
                            label={"Use predefined values"}
                            disabled={!predefinedValuesEnabled}
                            data-testid={`cms.editor.field.settings.general.switch-predefinedvalues`}
                        />
                    </Bind>
                </Grid.Column>

                <Grid.Column span={12}>
                    <Bind name={"description"}>
                        <Input
                            label={"Description"}
                            description={"This text will be shown below the label (optional)"}
                            size={"lg"}
                            data-testid={`cms.editor.field.settings.general.description`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"note"}>
                        <Input
                            label={"Note"}
                            description={"This text will be shown below the input (optional)"}
                            size={"lg"}
                            data-testid={`cms.editor.field.settings.general.note`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"help"}>
                        <Textarea
                            label={"Help"}
                            description={"This text will be shown in a tooltip (optional)"}
                            size={"lg"}
                            data-testid={`cms.editor.field.settings.general.help`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"tags"}>
                        <Tags
                            label={"Tags"}
                            description={"Field tags are useful for developers and are not visible in the UI (optional)"}
                            protectedTags={fieldPlugin.field.tags}
                            data-testid={`cms.editor.field.settings.general.tags`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>{additionalSettings}</Grid.Column>
            </Grid>
        </>
    );
};

export default GeneralTab;
