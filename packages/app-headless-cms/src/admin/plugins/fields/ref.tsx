import React, { useCallback, useMemo } from "react";
import type { ListCmsModelsQueryResponse } from "../../viewsGraphql.js";
import { LIST_CONTENT_MODELS, withoutBeingDeletedModels } from "../../viewsGraphql.js";
import { validation, ValidationError } from "@webiny/validation";
import { useSnackbar } from "@webiny/app-admin";
import type { CmsModel, CmsModelFieldTypePlugin } from "~/types.js";
import { ReactComponent as RefIcon } from "@webiny/icons/link.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import type { BindComponentRenderProp } from "@webiny/form";
import { Bind, useForm } from "@webiny/form";
import { useModel, useQuery } from "~/admin/hooks/index.js";
import { renderInfo } from "./ref/renderInfo.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { Grid, Label, MultiAutoComplete } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields");

const RefFieldSettings = () => {
    const { model } = useModel();
    const { data: formData } = useForm();
    const lockedFields = model.lockedFields || [];
    const fieldId = (formData || {}).fieldId || null;
    const isFieldLocked = lockedFields.some(
        lockedField => fieldId && lockedField.fieldId === fieldId
    );

    const { data, loading, error } = useQuery<ListCmsModelsQueryResponse>(LIST_CONTENT_MODELS);
    const { showSnackbar } = useSnackbar();

    if (error) {
        showSnackbar(error.message);
        return null;
    }

    // Format options for the Autocomplete component.
    const options = useMemo(() => {
        if (!data?.listContentModels?.data) {
            return [];
        }
        const models = withoutBeingDeletedModels(data.listContentModels.data);
        return (
            models
                /**
                 * Remove singleton models from the list of options.
                 */
                .filter(model => {
                    return !model.tags?.includes(CMS_MODEL_SINGLETON_TAG);
                })
                .map(model => {
                    return { value: model.modelId, label: model.name };
                })
        );
    }, [data]);

    const atLeastOneItem = useCallback(async (value: Pick<CmsModel, "modelId">) => {
        try {
            await validation.validate(value, "required,minLength:1");
        } catch {
            throw new ValidationError(`Please select at least 1 item`);
        }
    }, []);

    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name={"settings.models"} validators={atLeastOneItem}>
                    {(bind: BindComponentRenderProp<CmsModel[]>) => {
                        // Format value prop for MultiAutoComplete component.
                        const formattedValueForAutoComplete = options
                            .filter(option =>
                                bind.value.some(({ modelId }) => option.value === modelId)
                            )
                            .map(({ value }) => value);

                        return (
                            <MultiAutoComplete
                                {...bind}
                                size={"lg"}
                                values={formattedValueForAutoComplete}
                                onValuesChange={(values: string[]) => {
                                    bind.onChange(values.map(value => ({ modelId: value })));
                                }}
                                label={
                                    loading ? (
                                        t`Loading models...`
                                    ) : (
                                        <Label
                                            text={t`Content models`}
                                            description={"(cannot be changed later)"}
                                        />
                                    )
                                }
                                options={options}
                                disabled={isFieldLocked || loading}
                            />
                        );
                    }}
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-ref",
    field: {
        type: "ref",
        validators: ["required"],
        listValidators: ["minLength", "maxLength"],
        label: t`Reference`,
        description: t`Reference existing content entries. For example, a book can reference one or more authors.`,
        icon: <RefIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: false,
        multipleValuesLabel: t`Use as a list of references`,
        createField() {
            return {
                type: this.type,
                settings: {
                    models: []
                },
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings() {
            return <RefFieldSettings />;
        },
        graphql: {
            queryField: /* GraphQL */ `
                {
                    modelId
                    id
                }
            `
        },
        renderInfo
    }
};

export default plugin;
