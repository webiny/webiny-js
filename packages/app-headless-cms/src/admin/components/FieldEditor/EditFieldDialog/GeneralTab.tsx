import React, { useEffect, useCallback, useRef, useMemo } from "react";
import camelCase from "lodash/camelCase";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { CmsEditorField, CmsEditorFieldTypePlugin, TemporaryCmsEditorField } from "~/types";
import { FormRenderPropParams } from "@webiny/form/types";

import { useFieldEditor } from "~/admin/components/FieldEditor";
import { useContentModelEditor } from "~/admin/components/ContentModelEditor/useContentModelEditor";
import { generateAlphaNumericId } from "@webiny/utils";

interface GeneralTabProps {
    field: CmsEditorField<TemporaryCmsEditorField>;
    form: FormRenderPropParams;
    fieldPlugin: CmsEditorFieldTypePlugin;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ field, form, fieldPlugin }) => {
    const { Bind, setValue } = form;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { data } = useContentModelEditor();
    const { getField } = useFieldEditor();

    // Had problems with auto-focusing the "label" field. A couple of comments on this.
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
        }, 200);
    }, []);

    const afterChangeLabel = useCallback(
        (value: string) => {
            value = camelCase(value || "");
            if (field.id) {
                return;
            }
            if (!field._temporaryId) {
                field._temporaryId = generateAlphaNumericId(8);
            }
            setValue("fieldId", `${value}@${field.type}@${field._temporaryId}`);
            setValue("alias", value);
        },
        [field]
    );

    const beforeChangeAlias = useCallback(
        (value: string, baseOnChange: (value: string) => void) => {
            value = camelCase(value || "");

            baseOnChange(value);
        },
        []
    );

    const aliasValidator = useCallback((alias: string) => {
        if ((alias || "").trim().toLowerCase() !== "id") {
            return true;
        }

        throw new Error(`Cannot use "id" as Field Alias.`);
    }, []);

    const uniqueFieldIdValidator = useCallback((fieldId: string) => {
        const existingField = getField({ fieldId });
        if (!existingField) {
            return false;
        }

        if (existingField.id === field.id) {
            return true;
        }
        throw new Error(
            "Field ID is not unique for some reason. As it is automatically generated, something must be wrong with the generator."
        );
    }, []);

    const uniqueFieldAliasValidator = useCallback(
        (alias: string) => {
            if (!alias) {
                return true;
            }
            const existingField = getField({ alias });
            if (!existingField || existingField.id === field.id) {
                return true;
            }
            throw new Error("Please enter a unique Field Alias.");
        },
        [field]
    );

    let additionalSettings: React.ReactNode | null = null;
    if (typeof fieldPlugin.field.renderSettings === "function") {
        additionalSettings = fieldPlugin.field.renderSettings({
            form,
            afterChangeLabel,
            uniqueFieldIdValidator,
            contentModel: data
        });
    }

    const predefinedValuesEnabled = useMemo(
        (): boolean =>
            fieldPlugin.field.allowPredefinedValues &&
            typeof fieldPlugin.field.renderPredefinedValues === "function",
        [field.fieldId]
    );

    return (
        <>
            <Grid>
                <Cell span={4}>
                    <Bind
                        name={"label"}
                        validators={validation.create("required,maxLength:255")}
                        afterChange={(value: string) => {
                            afterChangeLabel(value);
                        }}
                    >
                        <Input
                            label={"Label"}
                            inputRef={inputRef}
                            description={"Name of the field"}
                        />
                    </Bind>
                </Cell>
                <Cell span={4}>
                    <Bind name={"fieldId"}>
                        <Input label={"Field ID"} disabled={true} />
                    </Bind>
                </Cell>
                <Cell span={4}>
                    <Bind
                        name={"alias"}
                        validators={[
                            validation.create("maxLength:255"),
                            uniqueFieldAliasValidator,
                            aliasValidator
                        ]}
                        beforeChange={beforeChangeAlias}
                    >
                        <Input
                            label={"Alias"}
                            description={`Name of the field to be accessible via GraphQL`}
                        />
                    </Bind>
                </Cell>

                <Cell span={6}>
                    <Bind name={"multipleValues"}>
                        <Switch
                            label={fieldPlugin.field.multipleValuesLabel}
                            disabled={!fieldPlugin.field.allowMultipleValues}
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"predefinedValues.enabled"}>
                        <Switch
                            label={"Use predefined values"}
                            disabled={!predefinedValuesEnabled}
                        />
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
