import React, { useState, useCallback } from "react";
import { IconButton } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import I18NInputDialog from "./I18NInputDialog";
import { ReactComponent as I18NIcon } from "./icons/round-translate-24px.svg";
import { cloneDeep } from "lodash";

const Input18n = (value, ...inputProps) => {
    const [values, setValues] = useState(null);

    const onClose = useCallback(() => {
        setValues(null);
    });

    const onSubmit = useCallback(data => {
        console.log(data);
    });

    return (
        <>
            <Input
                {...inputProps}
                values={value.values}
                trailingIcon={
                    <IconButton
                        tabIndex={2}
                        onClick={() => {
                            console.log("asd");
                            setValues(cloneDeep(value));
                        }}
                        icon={<I18NIcon />}
                    />
                }
            />
            <I18NInputDialog
                values={values}
                open={!!values}
                onClose={onClose}
                onSubmit={onSubmit}
            />
        </>
    );
};

export default Input18n;
