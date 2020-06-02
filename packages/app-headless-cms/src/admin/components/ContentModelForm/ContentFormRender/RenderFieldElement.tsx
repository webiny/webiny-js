import React, { useRef, useCallback, cloneElement } from "react";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import getValue from "./functions/getValue";
import setValue from "./functions/setValue";
import Label from "./components/Label";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

const RenderFieldElement = (props: {
    field: CmsEditorField;
    Bind: any;
    locale: any;
    renderPlugins: CmsEditorFieldRendererPlugin[];
}) => {
    const { renderPlugins, field, Bind: BaseFormBind, locale } = props;
    const renderPlugin = renderPlugins.find(
        plugin => plugin.renderer.rendererName === get(field, "renderer.name")
    );

    const memoizedBindComponents = useRef({});

    const getBind = useCallback(
        (index = -1) => {
            const memoKey = field.fieldId + field.multipleValues + index + locale;
            if (memoizedBindComponents.current[memoKey]) {
                return memoizedBindComponents.current[memoKey];
            }

            const name = field.fieldId;
            let validators,
                defaultValue = undefined;

            if (field.multipleValues) {
                defaultValue = [];
                validators = field.multipleValuesValidation;
                if (index >= 0) {
                    validators = field.validation;
                }
            } else {
                validators = field.validation;
            }

            memoizedBindComponents.current[memoKey] = function Bind({ children }) {
                return (
                    <BaseFormBind name={name} validators={validators} defaultValue={defaultValue}>
                        {bind => {
                            const value = getValue({ bind, locale, field, index });
                            const onChange = value =>
                                setValue({ value, bind, locale, field, index });

                            const props = {
                                ...bind,
                                value,
                                onChange
                            };

                            // Multiple-values functions below.
                            if (field.multipleValues) {
                                if (index >= 0) {
                                    props.removeValue = () => {
                                        if (index >= 0) {
                                            let value = getValue({
                                                bind,
                                                locale,
                                                field,
                                                index: -1
                                            });
                                            value = [
                                                ...value.slice(0, index),
                                                ...value.slice(index + 1)
                                            ];

                                            setValue({ value, bind, locale, field, index: -1 });
                                        }
                                    };
                                } else {
                                    props.appendValue = newValue => onChange([...value, newValue]);
                                    props.prependValue = newValue => onChange([newValue, ...value]);
                                    props.appendValues = newValues =>
                                        onChange([...value, ...newValues]);
                                }
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
        [field.fieldId, locale]
    );

    if (!renderPlugin) {
        return t`Cannot render "{fieldName}" field - field renderer missing.`({
            fieldName: <strong>{field.fieldId}</strong>
        });
    }

    return renderPlugin.renderer.render({ field, getBind, Label, locale });
};

export default RenderFieldElement;
