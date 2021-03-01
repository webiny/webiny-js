import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useQuery } from "../../hooks";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { validation, ValidationError } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { AutoComplete, Placement } from "@webiny/ui/AutoComplete";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorFieldTypePlugin } from "../../../types";
import { ReactComponent as RefIcon } from "./icons/round-link-24px.svg";

import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-ref",
    field: {
        type: "ref",
        validators: [],
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
                                // At this point we only use index 0.
                                // (we'll be upgrading this to allow `ref` field to accept different models in the future).
                                const modelId = get(bind, "value.0.modelId");

                                // Format value prop for AutoComplete component.
                                const formattedValueForAutoComplete = options.find(
                                    option => option.id === modelId
                                );

                                return (
                                    <AutoComplete
                                        {...bind}
                                        value={formattedValueForAutoComplete}
                                        onChange={value => {
                                            bind.onChange([{ modelId: value }]);
                                        }}
                                        label={t`Content Model`}
                                        description={t`Cannot be changed later`}
                                        options={options}
                                        placement={Placement.top}
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
                    entryId
                }
            `
        }
    }
};

export default plugin;
