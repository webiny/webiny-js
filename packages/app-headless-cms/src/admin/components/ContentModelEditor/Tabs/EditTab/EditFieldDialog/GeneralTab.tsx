import React, { useEffect, useCallback, useRef, useMemo } from "react";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { camelCase } from "lodash";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { validation } from "@webiny/validation";
import { CmsEditorField, CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { FormChildrenFunctionParams } from "@webiny/form/Form";

type GeneralTabProps = {
    field: CmsEditorField;
    form: FormChildrenFunctionParams;
    fieldPlugin: CmsEditorFieldTypePlugin;
};

const GeneralTab = ({ field, form, fieldPlugin }: GeneralTabProps) => {
    const { Bind, setValue } = form;
    const inputRef = useRef(null);
    const { getField, data } = useContentModelEditor();
    const { getValue } = useI18N();

    // Had problems with auto-focusing the "label" field. A couple of comments on this.
    // 1. It's probably caused by the Tabs component which wraps this component.
    // 2. It seems that the "autoFocus" prop on the Input does'nt work. I can't see it attached in the actual DOM.
    // 3. This works, but it's not 100%. Visually, the cursor is frozen, and that's probably caused by a bug / design
    //    in the RMWC / Material library. If you were to click somewhere on screen, and then apply focus, then
    //    it seems it's behaving correctly. ¯\_(ツ)_/¯
    useEffect(() => {
        setTimeout(() => {
            inputRef.current && inputRef.current.focus();
        }, 200);
    }, []);

    const afterChangeLabel = useCallback(value => {
        setValue("fieldId", camelCase(getValue(value)));
    }, []);

    const uniqueFieldIdValidator = useCallback(fieldId => {
        const existingField = getField({ fieldId });
        if (!existingField) {
            return;
        }

        if (existingField._id === field._id) {
            return true;
        }
        throw new Error("Please enter a unique Field ID");
    }, undefined);

    let additionalSettings = null;
    if (typeof fieldPlugin.field.renderSettings === "function") {
        additionalSettings = fieldPlugin.field.renderSettings({
            form,
            afterChangeLabel,
            uniqueFieldIdValidator,
            contentModel: data
        });
    }

    const predefinedValuesEnabled = useMemo(
        () =>
            fieldPlugin.field.allowPredefinedValues &&
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
                        afterChange={!field._id && afterChangeLabel}
                    >
                        <I18NInput label={"Label"} inputRef={inputRef} />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind
                        name={"fieldId"}
                        validators={[validation.create("required"), uniqueFieldIdValidator]}
                    >
                        <Input label={"Field ID"} disabled={!!field._id} />
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
                        <I18NInput label={"Help text"} description={"Help text (optional)"} />
                    </Bind>
                </Cell>
            </Grid>
            {additionalSettings}
        </>
    );
};

export default GeneralTab;
