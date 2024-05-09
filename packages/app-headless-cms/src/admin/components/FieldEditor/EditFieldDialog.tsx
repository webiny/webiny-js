import React, { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import styled from "@emotion/styled";
import { Dialog, DialogContent, DialogTitle, DialogActions } from "~/admin/components/Dialog";
import { Form, FormOnSubmit } from "@webiny/form";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentModel, CmsModelField } from "~/types";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import AppearanceTab from "./EditFieldDialog/AppearanceTab";
import PredefinedValues from "./EditFieldDialog/PredefinedValues";
import { ValidatorsList } from "./EditFieldDialog/ValidatorsList";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useModelField, useModelEditor } from "~/admin/hooks";
import { ModelFieldProvider } from "~/admin/components/ModelFieldProvider";
import { ValidationsSection } from "~/admin/components/FieldEditor/EditFieldDialog/ValidationsSection";
import { getFieldValidators, getListValidators } from "./EditFieldDialog/getValidators";
import { useRendererPlugins } from "~/admin/components/FieldEditor/EditFieldDialog/useRendererPlugins";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

const FullScreenDialog = styled(Dialog)`
    width: 100vw;
    height: 100vh;
    .mdc-dialog__surface {
        width: 100%;
        max-width: 100% !important;
        max-height: 100% !important;
        .webiny-ui-dialog__content {
            max-width: 100% !important;
            max-height: 100% !important;
            width: 100vw;
            height: calc(100vh - 155px);
            overflow: scroll !important;
        }
    }
`;

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
        <FullScreenDialog
            preventOutsideDismiss
            open={true}
            onClose={props.onClose}
            data-testid={"cms-editor-edit-fields-dialog"}
        >
            <DialogTitle>{headerTitle}</DialogTitle>
            <Form<CmsModelField> data={shadowField} onSubmit={onSubmit}>
                {({ data: shadowField, submit }) => {
                    const individualValidation = getFieldValidators(shadowField, fieldPlugin);

                    const hasValidators = individualValidation.validators.length > 0;

                    const showValidatorsTab =
                        shadowField.multipleValues || individualValidation.validators.length > 0;

                    const predefinedValuesTabEnabled =
                        fieldPlugin.field.allowPredefinedValues &&
                        shadowField.predefinedValues &&
                        shadowField.predefinedValues.enabled;

                    const listValidation = getListValidators(shadowField, fieldPlugin);

                    return (
                        /**
                         * We're using the `shadowField` as the new context, because we want all changes by form inputs
                         * to immediately be propagated to all dialog components.
                         */
                        <ModelFieldProvider field={shadowField}>
                            <DialogContent>
                                <Tabs>
                                    <Tab label={t`General`}>
                                        <GeneralTab />
                                    </Tab>
                                    <Tab
                                        label={t`Predefined Values`}
                                        disabled={!predefinedValuesTabEnabled}
                                    >
                                        {predefinedValuesTabEnabled && <PredefinedValues />}
                                    </Tab>

                                    <Tab
                                        visible={showValidatorsTab}
                                        label={"Validators"}
                                        data-testid={"cms.editor.field.tabs.validators"}
                                    >
                                        {shadowField.multipleValues ? (
                                            <>
                                                <ValidationsSection
                                                    validators={listValidation.validators}
                                                    fieldKey={"listValidators"}
                                                    title={
                                                        listValidation.title || "List validators"
                                                    }
                                                    description={
                                                        listValidation.description ||
                                                        "These validators are applied to the entire list of values."
                                                    }
                                                />

                                                {hasValidators ? (
                                                    <ValidationsSection
                                                        fieldKey={"validators"}
                                                        validators={individualValidation.validators}
                                                        title={
                                                            individualValidation.title ||
                                                            "Individual value validators"
                                                        }
                                                        description={
                                                            individualValidation.description ||
                                                            "These validators are applied to each value in the list."
                                                        }
                                                    />
                                                ) : null}
                                            </>
                                        ) : null}

                                        {!shadowField.multipleValues && hasValidators ? (
                                            <ValidatorsList
                                                name={"validation"}
                                                validators={individualValidation.validators}
                                            />
                                        ) : null}
                                    </Tab>
                                    <Tab label={t`Appearance`}>
                                        <AppearanceTab />
                                    </Tab>
                                </Tabs>
                            </DialogContent>
                            <DialogActions>
                                <ButtonDefault
                                    data-testid="cms.editor.field.settings.cancel"
                                    onClick={props.onClose}
                                >{t`Cancel`}</ButtonDefault>
                                <ButtonPrimary
                                    data-testid="cms.editor.field.settings.save"
                                    onClick={submit}
                                >{t`Save Field`}</ButtonPrimary>
                            </DialogActions>
                        </ModelFieldProvider>
                    );
                }}
            </Form>
        </FullScreenDialog>
    );
};

export default EditFieldDialog;
