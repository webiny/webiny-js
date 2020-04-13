import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { getPlugins } from "@webiny/plugins";
import { cloneDeep } from "lodash";
import { ContentModelFormLayout } from "./ContentModelFormLayout";

import {
    CmsContentModelFormProps,
    CmsContentModelForm,
    CmsContentModelModel,
    CmsFormFieldValidatorPlugin
} from "@webiny/app-headless-cms/types";

export const ContentModelForm = (props: CmsContentModelForm) => {
    const contentModelData = props.contentModel || ({} as CmsContentModelModel);
    if (!contentModelData.id) {
        return null;
    }

    const contentModel: CmsContentModelModel = cloneDeep(contentModelData);
    const { layout, fields } = contentModel;

    const getFieldById = id => {
        return fields.find(field => field._id === id);
    };

    const getFieldByFieldId = id => {
        return fields.find(field => field.fieldId === id);
    };

    const getFields = () => {
        const fields: any = cloneDeep(layout);
        const validatorPlugins = getPlugins<CmsFormFieldValidatorPlugin>("form-field-validator");

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

    const { loading, onSubmit, data } = props;
    const layoutProps: CmsContentModelFormProps = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        loading,
        onSubmit,
        data
    };

    return <ContentModelFormLayout {...layoutProps} />;
};
