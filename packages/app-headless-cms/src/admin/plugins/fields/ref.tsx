import React from "react";
import { ReactComponent as RefIcon } from "./icons/round-link-24px.svg";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { validation } from "@webiny/validation";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import get from "lodash/get";
import { css } from "emotion";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const selectStyles = css({
    '& label': {
        top: '10px !important',
        transform: 'translateY(-16%) scale(0.75) !important'
    }
});

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-ref",
    field: {
        type: "ref",
        validators: [],
        label: t`Reference`,
        description: t`For example a Product can ref its category(s).`,
        icon: <RefIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: true,
        allowIndexes: {
            singleValue: false,
            multipleValues: false
        },
        createField() {
            return {
                multipleValues: true,
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
        renderSettings({ form: { Bind } }) {
            const { data, loading, error } = useQuery(LIST_CONTENT_MODELS);
            const { showSnackbar } = useSnackbar();

            if (error) {
                showSnackbar(error.message);
                return null;
            }

            const contentModels = get(data, "listContentModels.data", []).map(item => {
                return { value: item.modelId, label: item.name };
            });

            return (
                <Grid>
                    {loading && <CircularProgress />}
                    <Cell span={12}>
                        <Bind name={"settings.modelId"} validators={validation.create("required")}>
                            <Select
                                label={t`Content Model`}
                                description={t`Cannot be changed later`}
                                className={selectStyles}
                            >
                                <option value="">{t`Choose a content model`}</option>
                                {contentModels.map(contentModel => {
                                    return (
                                        <option key={contentModel.value} value={contentModel.value}>
                                            {contentModel.label}
                                        </option>
                                    );
                                })}
                            </Select>
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
