import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useQuery } from "../../hooks";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { validation, ValidationError } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorFieldTypePlugin } from "~/types";
import { ReactComponent as RefIcon } from "./icons/round-link-24px.svg";

import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
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
        renderSettings({ form: { Bind, data: formData }, contentModel }) {
            const lockedFields = get(contentModel, "lockedFields", []);
            const fieldId = get(formData, "fieldId", null);
            const lockedField = lockedFields.find(lockedField => lockedField.fieldId === fieldId);

            const { data, loading, error } = useQuery(LIST_CONTENT_MODELS);
            const { showSnackbar } = useSnackbar();

            if (error) {
                showSnackbar(error.message);
                return null;
            }

            // Format options for the Autocomplete component.
            const options = useMemo(() => {
                return get(data, "listContentModels.data", []).map(model => {
                    return { id: model.modelId, name: model.name };
                });
            }, [data]);

            const atLeastOneItem = useCallback(async value => {
                try {
                    await validation.validate(value, "required,minLength:1");
                } catch (err) {
                    throw new ValidationError(`Please select at least 1 item`);
                }
            }, []);

            return (
                <Grid>
                    {loading && <CircularProgress />}
                    <Cell span={12}>
                        <Bind name={"settings.models"} validators={atLeastOneItem}>
                            {bind => {
                                // Format value prop for MultiAutoComplete component.
                                const formattedValueForAutoComplete = options.filter(option =>
                                    bind.value.some(({ modelId }) => option.id === modelId)
                                );

                                return (
                                    <MultiAutoComplete
                                        {...bind}
                                        value={formattedValueForAutoComplete}
                                        onChange={values => {
                                            bind.onChange(
                                                values.map(value => ({ modelId: value.id }))
                                            );
                                        }}
                                        label={t`Content Models`}
                                        description={t`Cannot be changed later`}
                                        options={options}
                                        disabled={lockedField && lockedField.modelId}
                                    />
                                );
                            }}
                        </Bind>
                    </Cell>
                </Grid>
            );
        },
        graphql: {
            queryField: /* GraphQL */ `
                {
                    modelId
                    id
                }
            `
        }
    }
};

export default plugin;
