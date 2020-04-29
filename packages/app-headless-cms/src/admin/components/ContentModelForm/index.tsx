import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { getPlugins } from "@webiny/plugins";
import { cloneDeep } from "lodash";
import { ContentModelFormRender } from "./ContentModelFormRender";
import { createCrudQueriesAndMutations } from "./graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/components/content-model-form");

import {
    CmsContentModelFormProps,
    CmsFormFieldValidatorPlugin
} from "@webiny/app-headless-cms/types";

export const ContentModelForm: React.FC<CmsContentModelFormProps> = props => {
    const { contentModel: contentModelRaw } = props;

    const contentModel = cloneDeep(contentModelRaw);
    const { layout, fields } = contentModel;

    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();

    const { PUBLISH_CONTENT_ENTRY, UNPUBLISH_CONTENT_ENTRY } = createCrudQueriesAndMutations(
        contentModel
    );

    const [publishContentMutation] = useMutation(PUBLISH_CONTENT_ENTRY);
    const [unpublishContentMutation] = useMutation(UNPUBLISH_CONTENT_ENTRY);

    const getFieldById = id => {
        return fields.find(field => field._id === id);
    };

    const getFields = () => {
        const fields: any = cloneDeep(layout);
        const validatorPlugins: CmsFormFieldValidatorPlugin[] = getPlugins("form-field-validator");

        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);

                row[idIndex].validators = row[idIndex].validation
                    .map(item => {
                        const validatorPlugin = validatorPlugins.find(
                            plugin => plugin.validator.name === item.name
                        );

                        if (
                            !validatorPlugin ||
                            typeof validatorPlugin.validator.validate !== "function"
                        ) {
                            return;
                        }

                        return async value => {
                            let isInvalid = true;
                            try {
                                const result = await validatorPlugin.validator.validate(
                                    value,
                                    item
                                );
                                isInvalid = result === false;
                            } catch (e) {
                                isInvalid = true;
                            }

                            if (isInvalid) {
                                throw new Error(
                                    I18NValue({ value: item.message }) || "Invalid value."
                                );
                            }
                        };
                    })
                    .filter(Boolean);
            });
        });
        return fields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        fields.forEach(field => {
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });
        return { ...values, ...overrides };
    };

    const onPublish = async () => {
        setLoading(true);
        const response = get(
            await publishContentMutation({
                variables: { revision: contentModel.id }
            }),
            "data.createContentModel"
        );

        setLoading(false);
        if (response.error) {
            return showSnackbar(response.error.message);
        }

        showSnackbar(t`Entry published successfully.`);
    };

    const onUnpublish = async () => {
        setLoading(true);
        const response = get(
            await unpublishContentMutation({
                variables: { revision: contentModel.id }
            }),
            "data.createContentModel"
        );

        setLoading(false);
        if (response.error) {
            return showSnackbar(response.error.message);
        }
        showSnackbar(t`Entry unpublished successfully.`);
    };

    const { loading: loadingProp, onSubmit, data, preview } = props;

    return (
        <ContentModelFormRender
            contentModel={contentModel}
            getFields={getFields}
            getDefaultValues={getDefaultValues}
            loading={loadingProp || loading}
            data={data}
            preview={preview}
            onSubmit={onSubmit}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
        />
    );
};
