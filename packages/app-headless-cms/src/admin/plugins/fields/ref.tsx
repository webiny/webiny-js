import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import { LIST_CONTENT_MODELS, ListCmsModelsQueryResponse } from "../../viewsGraphql";
import { validation, ValidationError } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsModel, CmsModelFieldTypePlugin } from "~/types";
import { ReactComponent as RefIcon } from "./icons/round-link-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { Bind, BindComponentRenderProp, useForm } from "@webiny/form";
import { useModel, useQuery } from "~/admin/hooks";
import { renderInfo } from "./ref/renderInfo";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";

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
        const models = get(data, "listContentModels.data", []) as CmsModel[];
        return (
            models
                /**
                 * Remove singleton models from the list of options.
                 */
                .filter(model => {
                    return !model.tags?.includes(CMS_MODEL_SINGLETON_TAG);
                })
                .map(model => {
                    return { id: model.modelId, name: model.name };
                })
        );
    }, [data]);

    const atLeastOneItem = useCallback(async (value: Pick<CmsModel, "modelId">) => {
        try {
            await validation.validate(value, "required,minLength:1");
        } catch (err) {
            throw new ValidationError(`Please select at least 1 item`);
        }
    }, []);

    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.models"} validators={atLeastOneItem}>
                    {(bind: BindComponentRenderProp<CmsModel[]>) => {
                        // Format value prop for MultiAutoComplete component.
                        const formattedValueForAutoComplete = options.filter(option =>
                            bind.value.some(({ modelId }) => option.id === modelId)
                        );

                        return (
                            <MultiAutoComplete
                                {...bind}
                                value={formattedValueForAutoComplete}
                                onChange={(values: CmsModel[]) => {
                                    bind.onChange(values.map(value => ({ modelId: value.id })));
                                }}
                                label={loading ? t`Loading models...` : t`Content models`}
                                description={t`Cannot be changed later`}
                                options={options}
                                disabled={isFieldLocked || loading}
                            />
                        );
                    }}
                </Bind>
            </Cell>
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
