import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
// Icons
import { ReactComponent as AddIcon } from "../../../assets/icons/add.svg";
import { ReactComponent as RemoveIcon } from "../../../assets/icons/remove.svg";
import { COLORS } from "../components/StyledComponents";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            margin: 0
        }
    }),
    icon: css({
        "& .mdc-list-item__graphic > svg": {
            transform: "rotate(90deg)"
        }
    }),
    button: css({
        "&.mdc-icon-button": {
            // backgroundColor: "var(--mdc-theme-background)",
            // borderRadius: "50%",
            border: `1px solid ${COLORS.gray}`
        },
        "&.mdc-icon-button:disabled": {
            cursor: "not-allowed"
        }
    })
};

type CellSizePropsType = {
    value: number;
    maxAllowed: number;
    label: string;
    onChange: (value: number) => void;
};
const CellSize: React.FunctionComponent<CellSizePropsType> = ({
    value,
    label,
    onChange,
    maxAllowed
}) => {
    const onReduceHandler = () => {
        const newValue = value - 1;
        if (newValue <= 0) {
            return false;
        }
        onChange(newValue);
    };

    const onAddHandler = () => {
        if (maxAllowed <= 0) {
            return false;
        }
        onChange(value + 1);
    };

    return (
        <Grid className={classes.grid}>
            <Cell align={"middle"} span={5}>
                <Typography use={"subtitle2"}>{label}</Typography>
            </Cell>
            <Cell align={"middle"} span={3}>
                <IconButton
                    disabled={value <= 1}
                    className={classes.button}
                    icon={<RemoveIcon />}
                    onClick={onReduceHandler}
                />
            </Cell>
            <Cell align={"middle"} span={1}>
                <Typography use={"subtitle2"}>{value}</Typography>
            </Cell>
            <Cell align={"middle"} span={3}>
                <IconButton
                    disabled={maxAllowed <= 0}
                    className={classes.button}
                    icon={<AddIcon />}
                    onClick={onAddHandler}
                />
            </Cell>
        </Grid>
    );
};

export default React.memo(CellSize);
