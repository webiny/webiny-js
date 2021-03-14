import React, { useRef, useCallback, cloneElement } from "react";
import { CmsEditorField, CmsEditorFieldRendererPlugin, CmsEditorContentModel } from "~/types";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { createValidators } from "./functions/createValidators";
import Label from "./components/Label";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

const RenderFieldElement = (props: {
    field: CmsEditorField;
    Bind: any;
    contentModel: CmsEditorContentModel;
    renderPlugins: CmsEditorFieldRendererPlugin[];
}) => {
    const { renderPlugins, field, Bind: BaseFormBind, contentModel } = props;

    const renderPlugin = renderPlugins.find(
        plugin => plugin.renderer.rendererName === get(field, "renderer.name")
    );

    const memoizedBindComponents = useRef({});

    const getBind = useCallback(
        (index = -1) => {
            const memoKey = field.fieldId + field.multipleValues + index;
            if (memoizedBindComponents.current[memoKey]) {
                return memoizedBindComponents.current[memoKey];
            }

            const isMultipleValues = index === -1 && field.multipleValues;

            const name = index >= 0 ? `${field.fieldId}.${index}` : field.fieldId;
            const validators = createValidators(field.validation || []);
            const listValidators = createValidators(field.listValidation || []);
            const defaultValue = field.multipleValues ? [] : undefined;

            memoizedBindComponents.current[memoKey] = function Bind({ children }) {
                return (
                    <BaseFormBind
                        name={name}
                        validators={isMultipleValues ? listValidators : validators}
                        defaultValue={index === -1 ? defaultValue : null}
                    >
                        {bind => {
                            // Multiple-values functions below.
                            const props = { ...bind };
                            if (field.multipleValues && index === -1) {
                                props.appendValue = newValue => {
                                    bind.onChange([...bind.value, newValue]);
                                };
                                props.prependValue = newValue => {
                                    bind.onChange([newValue, ...bind.value]);
                                };
                                props.appendValues = newValues => {
                                    bind.onChange([...bind.value, ...newValues]);
                                };

                                props.removeValue = index => {
                                    if (index >= 0) {
                                        let value = bind.value;
                                        value = [
                                            ...value.slice(0, index),
                                            ...value.slice(index + 1)
                                        ];

                                        bind.onChange(value);

                                        // To make sure the field is still valid, we must trigger validation.
                                        bind.form.validateInput(field.fieldId);
                                    }
                                };
                            }

                            if (typeof children === "function") {
                                return children(props);
                            }

                            return cloneElement(children, props);
                        }}
                    </BaseFormBind>
                );
            };

            return memoizedBindComponents.current[memoKey];
        },
        [field.fieldId]
    );

    if (!renderPlugin) {
        return t`Cannot render "{fieldName}" field - field renderer missing.`({
            fieldName: <strong>{field.fieldId}</strong>
        });
    }

    return renderPlugin.renderer.render({ field, getBind, Label, contentModel });
};

export default RenderFieldElement;
