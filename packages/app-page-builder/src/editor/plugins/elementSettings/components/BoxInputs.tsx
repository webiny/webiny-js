import React, { useEffect, useState } from "react";
import { get } from "lodash";
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
        "& .mdc-text-field__input": {
            padding: "0px !important",
            textAlign: "center"
        }
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
        label: "Right",
        key: "right"
    }
];

/**
 * MarginPaddingSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type PMSettingsPropsType = {
    label: string;
    value: any;
    valueKey: string;
    getUpdateValue: any;
    sides?: Record<string, any>[];
};

const BoxInputs: React.FunctionComponent<PMSettingsPropsType> = ({
    label,
    value,
    valueKey,
    getUpdateValue,
    sides = defaultCorners
}) => {
    const [linked, setLinked] = useState(true);

    const all = get(value, `${valueKey}.all`, 0);

    const [top, right, bottom, left] = sides.map(({ key, label }) => ({
        label,
        key,
        value: get(value, `${valueKey}.${key}`, 0)
    }));

    useEffect(() => {
        if (all !== 0 && linked === false) {
            // Reset "all" value.
            getUpdateValue(valueKey + ".all")(top.value);
        }
    }, [linked]);

    return (
        <Grid className={classes.gridWrapper}>
            <Cell span={12}>
                <Typography use={"subtitle2"}>{label}</Typography>
            </Cell>
            <Cell span={12} className={classes.wrapper}>
                <div className={classes.inputWrapper}>
                    <InputField
                        className={classes.input}
                        description={top.label}
                        value={linked ? all : top.value}
                        onChange={
                            linked
                                ? getUpdateValue(valueKey + ".all")
                                : getUpdateValue(`${valueKey}.${top.key}`)
                        }
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={linked}
                        className={classes.input}
                        description={right.label}
                        value={right.value}
                        onChange={getUpdateValue(`${valueKey}.${right.key}`)}
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={linked}
                        className={classes.input}
                        description={bottom.label}
                        value={bottom.value}
                        onChange={getUpdateValue(`${valueKey}.${bottom.key}`)}
                    />
                </div>
                <div className={classes.inputWrapper}>
                    <InputField
                        disabled={linked}
                        className={classes.input}
                        description={left.label}
                        value={left.value}
                        onChange={getUpdateValue(`${valueKey}.${left.key}`)}
                    />
                </div>
                <button
                    className={classNames(classes.linkSettings, {
                        [classes.linkSettingsActive]: linked
                    })}
                    onClick={() => setLinked(!linked)}
                >
                    <LinkIcon />
                </button>
            </Cell>
        </Grid>
    );
};

export default React.memo(BoxInputs);
