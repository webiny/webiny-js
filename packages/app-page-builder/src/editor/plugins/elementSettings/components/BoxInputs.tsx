import React, { useCallback } from "react";
import get from "lodash/get";
import classNames from "classnames";
import { css } from "emotion";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as LinkIcon } from "../../../assets/icons/link.svg";
// Components
import InputField from "./InputField";
import { COLORS } from "./StyledComponents";

const classes = {
    gridWrapper: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 36,
            "& .mdc-layout-grid__inner": {
                gridRowGap: 8
            }
        }
    }),
    wrapper: css({
        display: "flex"
    }),
    inputWrapper: css({
        height: 32
    }),
    input: css({
        textAlign: "center"
    }),
    linkSettings: css({
        display: "flex",
        alignItems: "center",
        border: `1px solid ${COLORS.gray}`,
        padding: "0px 5px",
        minHeight: 30,
        minWidth: 28,

        "& svg": {
            transform: "rotate(135deg)",
            width: 16,
            height: 16
        }
    }),
    linkSettingsActive: css({
        backgroundColor: "var(--mdc-theme-secondary)",
        color: "var(--mdc-theme-on-primary)"
    }),
    controllerWrapper: css({
        display: "flex",
        flexDirection: "column",

        "& button": {
            border: "1px solid var(--mdc-theme-on-background) !important",
            padding: "0px !important",
            height: "28px !important"
        },
        "&:first-child": {
            borderBottom: "none !important"
        }
    })
};

const defaultCorners = [
    {
        label: "Top",
        key: "top"
    },
    {
        label: "Right",
        key: "right"
    },
    {
        label: "Bottom",
        key: "bottom"
    },
    {
        label: "Left",
        key: "left"
    }
];

/**
 * MarginPaddingSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

interface PMSettingsPropsType {
    label: string;
    value: any;
    valueKey: string;
    getUpdateValue: any;
    sides?: Record<string, any>[];
}

const BoxInputs = ({
    label,
    value,
    valueKey,
    getUpdateValue,
    sides = defaultCorners
}: PMSettingsPropsType) => {
    const advanced = get(value, `${valueKey}.advanced`, false);
    const all = get(value, `${valueKey}.all`, 0);
    const [top, right, bottom, left] = sides.map(({ key, label }) => ({
        label,
        key,
        value: get(value, `${valueKey}.${key}`, 0)
    }));

    const toggleLinked = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            getUpdateValue(`${valueKey}.advanced`)(!advanced);
        },
        [advanced]
    );

    return (
        <Grid className={classes.gridWrapper}>
            <Cell span={12}>
                <Typography use={"body2"}>{label}</Typography>
            </Cell>
            <Cell span={12} className={classes.wrapper}>
                <div className={classes.inputWrapper}>
                    <InputField
                        className={classes.input}
                        description={top.label}
                        value={!advanced ? all : top.value}
                        onChange={
                            !advanced
                                ? getUpdateValue(valueKey + ".all")
                                : getUpdateValue(`${valueKey}.${top.key}`)
                        }
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={!advanced}
                        className={classes.input}
                        description={right.label}
                        value={advanced ? right.value : ""}
                        onChange={getUpdateValue(`${valueKey}.${right.key}`)}
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={!advanced}
                        className={classes.input}
                        description={bottom.label}
                        value={advanced ? bottom.value : ""}
                        onChange={getUpdateValue(`${valueKey}.${bottom.key}`)}
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={!advanced}
                        className={classes.input}
                        description={left.label}
                        value={advanced ? left.value : ""}
                        onChange={getUpdateValue(`${valueKey}.${left.key}`)}
                    />
                </div>
                <button
                    className={classNames(classes.linkSettings, {
                        [classes.linkSettingsActive]: !advanced
                    })}
                    onClick={toggleLinked}
                >
                    <LinkIcon />
                </button>
            </Cell>
        </Grid>
    );
};

export default React.memo(BoxInputs);
