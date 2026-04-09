import React, { useMemo, useState } from "react";
import type { FormOnSubmit } from "@webiny/form";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsEditorContentModel, CmsModelField } from "~/types.js";
import { useModelEditor, useModelField } from "~/admin/hooks/index.js";
import { useRendererPlugins } from "~/admin/components/FieldEditor/EditFieldDialog/useRendererPlugins.js";
import { getFieldValidators } from "~/admin/components/FieldEditor/EditFieldDialog/getValidators.js";
import { EditFieldDrawerContainer } from "./EditFieldDrawerContainer.js";
// To A/B test, swap the import above with the one below:
// import { EditFieldDialogContainer } from "./EditFieldDialogContainer.js";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

function setupState(field: CmsModelField, contentModel: CmsEditorContentModel): EditFieldState {
    const clonedField = structuredClone(field);

    if (!clonedField.renderer || !clonedField.renderer.name) {
        const [renderPlugin] = useRendererPlugins();

        if (renderPlugin) {
            clonedField.renderer = { name: renderPlugin.renderer.rendererName };
        }
    }

    return {
        shadowField: clonedField,
        isTitleField: contentModel.titleFieldId === field.fieldId
    };
}

interface EditFieldState {
    shadowField: CmsModelField;
    isTitleField: boolean;
}

interface EditFieldDialogProps {
    onClose: () => void;
    onSubmit: FormOnSubmit<CmsModelField>;
}

const EditFieldDialog = (props: EditFieldDialogProps) => {
    const { field, fieldPlugin } = useModelField();
    const { data: contentModel, setData: setContentModelData } = useModelEditor();
    const [{ shadowField, isTitleField }] = useState(setupState(field, contentModel));

    const headerTitle = t`Field Settings - {fieldTypeLabel}`({
        fieldTypeLabel: fieldPlugin.field.label
    });

    const onSubmit: FormOnSubmit<CmsModelField> = (data, form) => {
        /**
         * In case title field `fieldId` changed, we need to update the title field on the model itself.
         */
        if (isTitleField && contentModel.titleFieldId !== data.fieldId) {
            setContentModelData(prev => {
                return {
                    ...prev,
                    titleFieldId: data.fieldId
                };
            });
        }

        props.onSubmit(data, form);
    };

    const isSubtypeField = useMemo(() => {
        if (!field.type) {
            return false;
        }
        const value = field.type.split(":");
        return value.length > 1;
    }, [field.type]);

    return (
        /**
         * We're using the `shadowField` as the new context, because we want all changes by form inputs
         * to immediately be propagated to all dialog components.
         */
        <Form<CmsModelField> data={shadowField} onSubmit={onSubmit}>
            {({ data: shadowField, submit }) => {
                const predefinedValuesTabEnabled = !!(
                    fieldPlugin.field.allowPredefinedValues &&
                    shadowField.predefinedValues &&
                    shadowField.predefinedValues.enabled
                );

                const individualValidation = getFieldValidators(shadowField, fieldPlugin);
                const showValidatorsTab =
                    shadowField.list || individualValidation.validators.length > 0;

                return (
                    <EditFieldDrawerContainer
                        headerTitle={headerTitle}
                        shadowField={shadowField}
                        predefinedValuesTabEnabled={predefinedValuesTabEnabled}
                        showValidatorsTab={showValidatorsTab}
                        isSubtypeField={isSubtypeField}
                        onClose={props.onClose}
                        onSubmit={submit}
                    />
                );
            }}
        </Form>
    );
};

export default EditFieldDialog;
