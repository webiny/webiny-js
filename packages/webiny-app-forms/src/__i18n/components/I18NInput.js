import React, { useState, useCallback } from "react";
import { IconButton } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import I18NInputDialog from "./I18NInputDialog";
import { ReactComponent as I18NIcon } from "./icons/round-translate-24px.svg";
import { css } from "emotion";
import { useI18N } from "webiny-app-forms/__i18n/components";
import classNames from "classnames";

const style = {
    i18nDialogIconButton: css({
        ".rmwc-icon": {
            pointerEvents: "all"
        }
    })
};

const prepareII8NValues = ({ locales, values }) => {
    const output = [];
    for (let i = 0; i < locales.length; i++) {
        const item = values.find(item => item.locale === locales[i]);
        if (item) {
            output.push({ ...item });
        } else {
            output.push({
                locale: locales[i],
                value: ""
            });
        }
    }
    return output;
};

const I18NInput = ({ value, onChange, ...inputProps }) => {
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
        await onChange({ ...value, values });
        closeDialog();
    });

    let inputValue = "";
    if (value && Array.isArray(value.values)) {
        const foundValue = value.values.find(item => item.locale === getLocale());
        if (foundValue) {
            inputValue = foundValue.value;
        }
    }

    const inputOnChange = useCallback(inputValue => {
        const newValue = { values: [], ...value };
        const index = value ? value.values.findIndex(item => item.locale === getLocale()) : -1;
        if (index >= 0) {
            newValue.values[index].value = inputValue;
        } else {
            newValue.values.push({ locale: getLocale(), value: inputValue });
        }

        onChange(newValue);
    });

    return (
        <>
            <Input
                {...inputProps}
                value={inputValue}
                onChange={inputOnChange}
                className={classNames(inputProps.className, style.i18nDialogIconButton)}
                trailingIcon={<IconButton icon={<I18NIcon />} onClick={openDialog} />}
            />
            <I18NInputDialog
                values={values}
                open={!!values}
                onClose={closeDialog}
                onSubmit={submitDialog}
            />
        </>
    );
};

export default I18NInput;
