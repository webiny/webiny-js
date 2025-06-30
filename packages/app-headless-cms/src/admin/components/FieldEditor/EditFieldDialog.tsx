import React, { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import { Dialog, Tabs } from "@webiny/admin-ui";
import { Form, FormOnSubmit } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentModel, CmsModelField } from "~/types";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import AppearanceTab from "./EditFieldDialog/AppearanceTab";
import PredefinedValues from "./EditFieldDialog/PredefinedValues";
import { ValidationTab } from "./EditFieldDialog/ValidationTab";
import { useModelField, useModelEditor } from "~/admin/hooks";
import { ModelFieldProvider } from "~/admin/components/ModelFieldProvider";
import { useRendererPlugins } from "~/admin/components/FieldEditor/EditFieldDialog/useRendererPlugins";
import { getFieldValidators } from "~/admin/components/FieldEditor/EditFieldDialog/getValidators";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

function setupState(field: CmsModelField, contentModel: CmsEditorContentModel): EditFieldState {
    const clonedField = cloneDeep(field);

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

    return (
        /**
         * We're using the `shadowField` as the new context, because we want all changes by form inputs
         * to immediately be propagated to all dialog components.
         */
        <Form<CmsModelField> data={shadowField} onSubmit={onSubmit}>
            {({ data: shadowField, submit }) => {
                const predefinedValuesTabEnabled =
                    fieldPlugin.field.allowPredefinedValues &&
                    shadowField.predefinedValues &&
                    shadowField.predefinedValues.enabled;

                const individualValidation = getFieldValidators(shadowField, fieldPlugin);
                const showValidatorsTab =
                    shadowField.multipleValues || individualValidation.validators.length > 0;

                return (
                    <Dialog
                        size={"full"}
                        title={headerTitle}
                        open={true}
                        modal={true}
                        onClose={props.onClose}
                        bodyPadding={false}
                        actions={
                            <>
                                <Dialog.CancelButton
                                    text={t`Cancel`}
                                    onClick={props.onClose}
                                    data-testid="cms.editor.field.settings.cancel"
                                />
                                <Dialog.ConfirmButton
                                    text={t`Save Field`}
                                    onClick={submit}
                                    data-testid="cms.editor.field.settings.save"
                                />
                            </>
                        }
                        data-testid={"cms-editor-edit-fields-dialog"}
                    >
                        <ModelFieldProvider field={shadowField}>
                            <Tabs
                                spacing={"lg"}
                                size={"md"}
                                separator
                                tabs={[
                                    <Tabs.Tab
                                        key={"general"}
                                        trigger={t`General`}
                                        value={"general"}
                                        content={<GeneralTab />}
                                    />,
                                    <Tabs.Tab
                                        key={"predefined"}
                                        trigger={t`Predefined values`}
                                        value={"predefined"}
                                        disabled={!predefinedValuesTabEnabled}
                                        content={<PredefinedValues />}
                                    />,
                                    <Tabs.Tab
                                        key={"validations"}
                                        trigger={t`Validations`}
                                        value={"validations"}
                                        content={<ValidationTab field={shadowField} />}
                                        visible={showValidatorsTab}
                                    />,
                                    <Tabs.Tab
                                        key={"appearance"}
                                        trigger={t`Appearance`}
                                        value={"Appearance"}
                                        content={<AppearanceTab />}
                                    />
                                ]}
                            />
                        </ModelFieldProvider>
                    </Dialog>
                );
            }}
        </Form>
    );
};

export default EditFieldDialog;
