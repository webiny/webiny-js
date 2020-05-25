import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Form } from "@webiny/form";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import cloneDeep from "lodash.clonedeep";
import get from "lodash.get";
import { CircularProgress } from "@webiny/ui/Progress";
import { getPlugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/components/content-form");

const empty = [null, undefined];

const setValue = ({ value, bind, locale }) => {
    const newValue = cloneDeep({ values: [], ...bind.value });
    const index = empty.includes(value)
        ? -1
        : newValue.values.findIndex(item => item.locale === locale);
    if (index >= 0) {
        newValue.values[index].value = value;
    } else {
        newValue.values.push({ locale: locale, value: value });
    }

    // Filter out redundant empty values.
    newValue.values = newValue.values.filter(item => !!item.value);
    bind.onChange(newValue);
};

const getValue = ({ bind, locale }) => {
    const value = get(bind, "value.values", []).find(item => item.locale === locale);
    return value ? value.value : null;
};

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
            const memoKey = field.fieldId + index;
            if (memoizedBindComponents.current[memoKey]) {
                return memoizedBindComponents.current[memoKey];
            }

            let name, validators;
            if (field.multipleValues) {
                name = field.fieldId;
                validators = field.multipleValuesValidation;
                if (index >= 0) {
                    name = `${name}.${index}`;
                    validators = field.validation;
                }
            } else {
                name = field.fieldId;
                validators = field.validation;
            }

            memoizedBindComponents.current[memoKey] = function Bind({ children }) {
                return (
                    <BaseFormBind name={name} validators={validators}>
                        {bind => {
                            return children({
                                ...bind,
                                value: getValue({ bind, locale }),
                                onChange: value => setValue({ value, bind, locale })
                            });
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

    return renderPlugin.renderer.render({ field, getBind });
};

export const ContentFormRender = ({
    getFields,
    getDefaultValues,
    loading = false,
    content,
    onSubmit,
    onChange,
    locale,
    onForm = null
}) => {
    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();
    const ref = useRef(null);

    useEffect(() => {
        typeof onForm === "function" && onForm(ref.current);
    }, []);

    const renderPlugins = useMemo(
        () => getPlugins<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );

    return (
        <Form
            onChange={onChange}
            onSubmit={onSubmit}
            data={content ? content : getDefaultValues()}
            ref={ref}
        >
            {({ Bind }) => (
                <div data-testid={"cms-content-form"}>
                    {loading && <CircularProgress />}
                    <Grid>
                        {/* Let's render all form fields. */}
                        {fields.map((row, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                {row.map(field => (
                                    <Cell span={Math.floor(12 / row.length)} key={field._id}>
                                        <RenderFieldElement
                                            field={field}
                                            Bind={Bind}
                                            locale={locale}
                                            renderPlugins={renderPlugins}
                                        />
                                    </Cell>
                                ))}
                            </React.Fragment>
                        ))}
                    </Grid>
                </div>
            )}
        </Form>
    );
};
