import React from "react";
import { ReactComponent as RefIcon } from "./icons/round-link-24px.svg";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { validation } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { AutoComplete, Placement } from "@webiny/ui/AutoComplete";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import get from "lodash/get";

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
        allowIndexes: {
            singleValue: false,
            multipleValues: false
        },
        multipleValuesLabel: t`Use as a list of references`,
        createField() {
            return {
                type: this.type,
                settings: {
                    modelId: ""
                },
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings({ form: { Bind }, lockedField }) {
            const { data, loading, error } = useQuery(LIST_CONTENT_MODELS);
            const { showSnackbar } = useSnackbar();

            if (error) {
                showSnackbar(error.message);
                return null;
            }
            // Format options for the Autocomplete component.
            const options = get(data, "listContentModels.data", []).map(item => {
                return { id: item.modelId, name: item.name };
            });

            return (
                <Grid>
                    {loading && <CircularProgress />}
                    <Cell span={12}>
                        <Bind name={"settings.modelId"} validators={validation.create("required")}>
                            {bind => {
                                const id = get(bind, "value.id", bind.value);
                                // Format value prop for AutoComplete component.
                                const formattedValueForAutoComplete = options.find(
                                    option => option.id === id
                                );

                                return (
                                    <AutoComplete
                                        {...bind}
                                        value={formattedValueForAutoComplete}
                                        onChange={bind.onChange}
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
                    values {
                        value {
                            id
                            meta {
                                title {
                                    value
                                }
                            }
                        }
                        locale
                    }
                }
            `
        }
    }
};

export default plugin;
