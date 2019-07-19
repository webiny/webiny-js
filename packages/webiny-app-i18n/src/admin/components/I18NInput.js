import React, { useState, useCallback, useMemo } from "react";
import { Icon } from "webiny-ui/Icon";
import { Input } from "webiny-ui/Input";
import I18NInputLocalesOverlay from "./I18NInputLocalesOverlay";
import { ReactComponent as I18NIcon } from "./icons/round-translate-24px.svg";
import { css } from "emotion";
import { useI18N } from "webiny-app-i18n/components";
import { Tooltip } from "webiny-ui/Tooltip";
import classNames from "classnames";
import { cloneDeep } from "lodash";
import I18NRichTextEditor from "./I18NRichTextEditor";

const style = {
    i18nDialogIconButton: css({
        ".webiny-ui-tooltip": {
            display: "block"
        },
        ".webiny-ui-icon": {
            pointerEvents: "all",
            cursor: "pointer",
            zIndex: 1
        }
    })
};

const prepareII8NValues = ({ locales, values }) => {
    const output = [];
    for (let i = 0; i < locales.length; i++) {
        const item = values.find(item => item.locale === locales[i].id);
        if (item) {
            output.push({ ...item });
        } else {
            output.push({
                locale: locales[i].id,
                value: ""
            });
        }
    }
    return output;
};

const I18NInput = ({ richText, value, onChange, ...inputProps }) => {
    const [values, setValues] = useState(null);
    const { getLocale, getLocales } = useI18N();

    const openDialog = useCallback(() => {
        const newValues = prepareII8NValues({
            locales: getLocales(),
            values: value && Array.isArray(value.values) ? value.values : []
        });
        setValues(newValues);
    });

    const closeDialog = useCallback(() => {
        setValues(null);
    });

    const submitDialog = useCallback(async values => {
        // Filter out redundant empty values.
        await onChange({ ...value, values: values.filter(item => !!item.value) });
        closeDialog();
    });

    let inputValue = "";
    if (value && Array.isArray(value.values)) {
        const foundValue = value.values.find(item => item.locale === getLocale().id);
        if (foundValue) {
            inputValue = foundValue.value;
        }
    }

    const inputOnChange = inputValue => {
        const newValue = cloneDeep({ values: [], ...value });
        const index = value ? value.values.findIndex(item => item.locale === getLocale().id) : -1;
        if (index >= 0) {
            newValue.values[index].value = inputValue;
        } else {
            newValue.values.push({ locale: getLocale().id, value: inputValue });
        }

        // Filter out redundant empty values.
        newValue.values = newValue.values.filter(item => !!item.value);
        onChange(newValue);
    };

    const translateMenuItem = useMemo(() => {
        return {
            name: "i18NInputLocalesOverlay",
            menu: {
                render({ MenuButton }: Object) {
                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={openDialog}>
                            <I18NIcon />
                        </MenuButton>
                    );
                }
            }
        };
    }, []);

    return (
        <>
            {richText ? (
                <I18NRichTextEditor
                    {...inputProps}
                    value={inputValue}
                    onChange={inputOnChange}
                    plugins={[translateMenuItem]}
                />
            ) : (
                <Input
                    {...inputProps}
                    value={inputValue}
                    onChange={inputOnChange}
                    className={classNames(inputProps.className, style.i18nDialogIconButton)}
                    trailingIcon={
                        <Tooltip content={<span>Set locale values</span>} placement={"top"}>
                            <Icon icon={<I18NIcon />} onClick={openDialog} />
                        </Tooltip>
                    }
                />
            )}

            <I18NInputLocalesOverlay
                richText={richText}
                values={values}
                open={!!values}
                onClose={closeDialog}
                onSubmit={submitDialog}
            />
        </>
    );
};

export default I18NInput;
