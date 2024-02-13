import React, { useEffect, useState } from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
// Icons
import { ReactComponent as AddIcon } from "../../../assets/icons/add.svg";
import { ReactComponent as RemoveIcon } from "../../../assets/icons/remove.svg";
import { COLORS } from "../components/StyledComponents";

const classes = {
    grid: css({
        position: "relative",
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 8
        }
    }),
    icon: css({
        "& .mdc-deprecated-list-item__graphic > svg": {
            transform: "rotate(90deg)"
        }
    }),
    button: css({
        "&.mdc-icon-button": {
            backgroundColor: "var(--mdc-theme-background)",
            borderRadius: "50%",
            border: `1px solid ${COLORS.gray}`
        },
        "&.mdc-icon-button:disabled": {
            cursor: "not-allowed",
            pointerEvents: "all",
            opacity: 0.5
        }
    }),
    errorMessageContainer: css({
        position: "absolute",
        bottom: -20,
        right: 0
    })
};

interface CounterInputPropsType {
    value: number;
    maxAllowed: number;
    label: string;
    minErrorMessage: string;
    maxErrorMessage: string;
    onChange: (value: number) => void;
}
const CounterInput = ({
    value,
    label,
    minErrorMessage,
    maxErrorMessage,
    onChange,
    maxAllowed
}: CounterInputPropsType) => {
    const [errorMessage, setErrorMessage] = useState("");
    // Hide error message after 2s.
    useEffect((): void => {
        if (errorMessage.length) {
            setTimeout(() => setErrorMessage(""), 2000);
        }
    }, [errorMessage]);

    const onReduceHandler = (): boolean => {
        const newValue = value - 1;
        if (newValue <= 0) {
            setErrorMessage(minErrorMessage);
            return false;
        }
        onChange(newValue);
        return true;
    };

    const onAddHandler = (): boolean => {
        if (maxAllowed <= 0) {
            setErrorMessage(maxErrorMessage);
            return false;
        }
        onChange(value + 1);
        return true;
    };

    return (
        <Grid className={classes.grid}>
            <Cell align={"middle"} span={5}>
                <Typography use={"body2"}>{label}</Typography>
            </Cell>
            <Cell align={"middle"} span={3}>
                <IconButton
                    className={classes.button}
                    icon={<RemoveIcon />}
                    onClick={onReduceHandler}
                />
            </Cell>
            <Cell align={"middle"} span={1}>
                <Typography use={"body2"}>{value}</Typography>
            </Cell>
            <Cell align={"middle"} span={3}>
                <IconButton className={classes.button} icon={<AddIcon />} onClick={onAddHandler} />
            </Cell>
            <FormElementMessage error={true} className={classes.errorMessageContainer}>
                {errorMessage}
            </FormElementMessage>
        </Grid>
    );
};

export default React.memo(CounterInput);
