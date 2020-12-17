import React from "react";
import { cloneDeep, pick } from "lodash";
import { plugins } from "@webiny/plugins";
import { ContentFormRender } from "./ContentFormRender";

import {
    CmsContentModelFormProps,
    CmsFormFieldValidatorPlugin
} from "@webiny/app-headless-cms/types";

export const ContentModelForm: React.FC<CmsContentModelFormProps> = props => {
    const { contentModel: contentModelRaw } = props;

    const contentModel = cloneDeep(contentModelRaw);
    const { layout, fields } = contentModel;

    const getFieldById = id => {
        return fields.find(field => field.id === id);
    };

    const getFields = () => {
        let returnFields = [];
        if (layout) {
            returnFields = cloneDeep(layout);
        } else {
            // If no layout provided, just render all fields one below other.
            returnFields = [...fields.map(item => [item.id])];
        }

        const validatorPlugins: CmsFormFieldValidatorPlugin[] = plugins.byType(
            "form-field-validator"
        );

        returnFields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);

                if (Array.isArray(row[idIndex].validation)) {
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
                                let isInvalid;
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
                                    throw new Error(item.message);
                                }
                            };
                        })
                        .filter(Boolean);
                }
            });
        });

        return returnFields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        // TODO: finish default values.
        /*fields.forEach(field => {
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });*/
        return { ...values, ...overrides };
    };

    const { content, onSubmit, onChange, onForm } = props;

    return (
        <ContentFormRender
            onForm={onForm}
            getFields={getFields}
            getDefaultValues={getDefaultValues}
            content={content}
            contentModel={contentModel}
            onChange={onChange}
            onSubmit={async data => {
                const fieldsIds = contentModel.fields.map(item => item.fieldId);
                return onSubmit(pick(data, [...fieldsIds]));
            }}
        />
    );
};
