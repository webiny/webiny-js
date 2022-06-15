import React, { useState, useEffect, useCallback } from "react";
import { cloneDeep } from "lodash";
import { css } from "emotion";
import { Dialog, DialogContent, DialogTitle, DialogActions } from "@webiny/ui/Dialog";
import { Form } from "@webiny/form";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { i18n } from "@webiny/app/i18n";
import {
    CmsEditorField,
    CmsEditorFieldRendererPlugin,
    CmsEditorFieldTypePlugin,
    CmsEditorFieldValidatorPlugin
} from "~/types";
import { plugins } from "@webiny/plugins";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import AppearanceTab from "./EditFieldDialog/AppearanceTab";
import PredefinedValues from "./EditFieldDialog/PredefinedValues";
import ValidatorsTab from "./EditFieldDialog/ValidatorsTab";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { useFieldEditor } from "~/admin/components/FieldEditor/useFieldEditor";
import invariant from "invariant";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

const dialogBody = css({
    "&.webiny-ui-dialog__content": {
        width: 875,
        height: 450
    }
});

interface EditFieldDialogProps {
    field: CmsEditorField | null;
    onClose: () => void;
    onSubmit: (data: CmsEditorField) => void;
}

interface Validator {
    optional: boolean;
    validator: CmsEditorFieldValidatorPlugin["validator"];
}
const getValidators = (
    fieldPlugin: CmsEditorFieldTypePlugin,
    /**
     * We only have validators and listValidators, thats why the strict string types
     */
    key: "validators" | "listValidators",
    defaultValidators: string[] = []
): Validator[] => {
    const mappedValidators = plugins
        .byType<CmsEditorFieldValidatorPlugin>("cms-editor-field-validator")
        .map(({ validator }) => {
            const allowedValidators = fieldPlugin.field[key] || defaultValidators;
            if (allowedValidators.includes(validator.name)) {
                return {
                    optional: true,
                    validator
                };
            } else if (allowedValidators.includes(`!${validator.name}`)) {
                return {
                    optional: false,
                    validator
                };
            }

            return null;
        });

    const filteredValidators = mappedValidators.filter(Boolean) as Validator[];

    return (
        filteredValidators
            /**
             * We can safely cast because we are filtering in previous step.
             */
            .sort((a: Validator, b: Validator) => {
                if (!a.optional && b.optional) {
                    return -1;
                }

                if (a.optional && !b.optional) {
                    return 1;
                }

                return 0;
            }) as Validator[]
    );
};

const getListValidators = (fieldPlugin: CmsEditorFieldTypePlugin) => {
    return getValidators(fieldPlugin, "listValidators", ["minLength", "maxLength"]);
};

const getFieldValidators = (fieldPlugin: CmsEditorFieldTypePlugin) => {
    return getValidators(fieldPlugin, "validators");
};

const fieldEditorDialog = css({
    width: "100vw",
    height: "100vh",
    ".mdc-dialog__surface": {
        maxWidth: "100% !important",
        maxHeight: "100% !important",
        ".webiny-ui-dialog__content": {
            maxWidth: "100% !important",
            maxHeight: "100% !important",
            width: "100vw",
            height: "calc(100vh - 155px)",
            paddingTop: "0 !important"
        }
    }
});

const EditFieldDialog: React.FC<EditFieldDialogProps> = ({ field, onSubmit, ...props }) => {
    const [current, setCurrent] = useState<CmsEditorField | null>(null);

    const { getFieldPlugin } = useFieldEditor();

    useEffect((): void => {
        if (!field) {
            setCurrent(field);
            return;
        }

        const clonedField = cloneDeep(field);

        if (!clonedField.renderer || !clonedField.renderer.name) {
            const [renderPlugin] = plugins
                .byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer")
                .filter(item => item.renderer.canUse({ field }));

            if (renderPlugin) {
                clonedField.renderer = { name: renderPlugin.renderer.rendererName };
            }
        }

        setCurrent(clonedField);
    }, [field]);

    const onClose = useCallback((): void => {
        setCurrent(null);
        props.onClose();
    }, []);

    let render = null;
    let headerTitle = t`Field Settings`;

    if (current) {
        /**
         * Something must be very wrong for field plugin to be missing.
         */
        const fieldPlugin = getFieldPlugin(current.type) as CmsEditorFieldTypePlugin;
        /**
         * We will throw error because of that.
         */
        invariant(fieldPlugin, `Missing field plugin for type "${current.type}".`);

        headerTitle = t`Field Settings - {fieldTypeLabel}`({
            fieldTypeLabel: fieldPlugin.field.label
        });

        render = (
            <Form
                data={current}
                onSubmit={data => {
                    /**
                     * We know that data is CmsEditorField.
                     */
                    return onSubmit(data as unknown as CmsEditorField);
                }}
            >
                {form => {
                    const predefinedValuesTabEnabled =
                        fieldPlugin.field.allowPredefinedValues &&
                        form.data.predefinedValues &&
                        form.data.predefinedValues.enabled;

                    return (
                        <>
                            <DialogContent className={dialogBody}>
                                <Tabs>
                                    <Tab label={t`General`}>
                                        <GeneralTab
                                            form={form}
                                            field={form.data as CmsEditorField}
                                            fieldPlugin={fieldPlugin}
                                        />
                                    </Tab>
                                    <Tab
                                        label={t`Predefined Values`}
                                        disabled={!predefinedValuesTabEnabled}
                                    >
                                        {predefinedValuesTabEnabled && (
                                            <PredefinedValues
                                                form={form}
                                                field={form.data as CmsEditorField}
                                                fieldPlugin={fieldPlugin}
                                            />
                                        )}
                                    </Tab>

                                    {form.data.multipleValues && (
                                        <Tab
                                            label={"Validators"}
                                            data-testid={"cms.editor.field.tabs.validators"}
                                        >
                                            <Grid>
                                                <Cell span={12}>
                                                    <Typography use={"headline5"}>
                                                        List validators
                                                    </Typography>
                                                    <br />
                                                    <Typography use={"body2"}>
                                                        These validators are applied to the entire
                                                        list of values.
                                                    </Typography>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Elevation z={2}>
                                                        <ValidatorsTab
                                                            field={current}
                                                            name={"listValidation"}
                                                            validators={getListValidators(
                                                                fieldPlugin
                                                            )}
                                                            form={form}
                                                        />
                                                    </Elevation>
                                                </Cell>
                                            </Grid>

                                            <Grid>
                                                <Cell span={12}>
                                                    <Typography use={"headline5"}>
                                                        Individual value validators
                                                    </Typography>
                                                    <br />
                                                    <Typography use={"body2"}>
                                                        These validators are applied to each value
                                                        in the list.
                                                    </Typography>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Elevation z={2}>
                                                        <ValidatorsTab
                                                            field={current}
                                                            form={form}
                                                            name={"validation"}
                                                            validators={getFieldValidators(
                                                                fieldPlugin
                                                            )}
                                                        />
                                                    </Elevation>
                                                </Cell>
                                            </Grid>
                                        </Tab>
                                    )}

                                    {!form.data.multipleValues &&
                                        Array.isArray(fieldPlugin.field.validators) &&
                                        fieldPlugin.field.validators.length > 0 && (
                                            <Tab
                                                label={"Validators"}
                                                data-testid={"cms.editor.field.tabs.validators"}
                                            >
                                                <ValidatorsTab
                                                    field={current}
                                                    form={form}
                                                    name={"validation"}
                                                    validators={getFieldValidators(fieldPlugin)}
                                                />
                                            </Tab>
                                        )}
                                    <Tab label={t`Appearance`}>
                                        <AppearanceTab
                                            form={form}
                                            field={form.data as CmsEditorField}
                                            // TODO @ts-refactor verify that this actually worked? There was no fieldPlugin in AppearanceTab props
                                            // @ts-ignore
                                            fieldPlugin={fieldPlugin}
                                        />
                                    </Tab>
                                </Tabs>
                            </DialogContent>
                            <DialogActions>
                                <ButtonDefault
                                    data-testid="cms.editor.field.settings.cancel"
                                    onClick={onClose}
                                >{t`Cancel`}</ButtonDefault>
                                <ButtonPrimary
                                    data-testid="cms.editor.field.settings.save"
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >{t`Save Field`}</ButtonPrimary>
                            </DialogActions>
                        </>
                    );
                }}
            </Form>
        );
    }

    return (
        <Dialog
            preventOutsideDismiss
            open={!!current}
            onClose={onClose}
            data-testid={"cms-editor-edit-fields-dialog"}
            className={fieldEditorDialog}
        >
            <DialogTitle>{headerTitle}</DialogTitle>
            {render}
        </Dialog>
    );
};

export default EditFieldDialog;
