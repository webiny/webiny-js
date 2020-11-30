import React, { useEffect, useState } from "react";
import { get } from "lodash";
import classNames from "classnames";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
// Icons
// import { ReactComponent as ArrowUpIcon } from "../../../assets/icons/arrow_drop_up.svg";
// import { ReactComponent as ArrowDownIcon } from "../../../assets/icons/arrow_drop_down.svg";
import { ReactComponent as LinkIcon } from "../../../assets/icons/link.svg";
// Components
import WrappedInput from "./WrappedInput";

const classes = {
    gridWrapper: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24,
            "& .mdc-layout-grid__inner": {
                gridRowGap: 4
            }
        }
    }),
    wrapper: css({
        display: "flex",
        /**
         * We're applying this style here to counter the extra "padding-left"
         * on the "Accordion Item" content.
         */
        marginLeft: -45
    }),
    input: css({
        "& .mdc-text-field__input": {
            padding: "0px !important",
            textAlign: "center"
        }
    }),
    linkSettings: css({
        display: "flex !important",
        height: "56px !important",
        border: "1px solid var(--mdc-theme-on-background) !important",

        "& svg": {
            transform: "rotate(135deg)"
        }
    }),
    linkSettingsActive: css({
        backgroundColor: "var(--mdc-theme-secondary) !important",
        color: "var(--mdc-theme-on-primary) !important"
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
    showControls?: boolean;
    sides?: Record<string, any>[];
};

const BoxInputs: React.FunctionComponent<PMSettingsPropsType> = ({
    label,
    value,
    valueKey,
    getUpdateValue,
    showControls,
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
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={12} className={classes.wrapper}>
                <WrappedInput
                    className={classes.input}
                    description={top.label}
                    value={linked ? all : top.value}
                    onChange={
                        linked
                            ? getUpdateValue(valueKey + ".all")
                            : getUpdateValue(`${valueKey}.${top.key}`)
                    }
                />
                {showControls && (
                    <div className={classes.controllerWrapper}>
                        {/*<IconButton disabled={advanced} onClick={increment} icon={<ArrowUpIcon />} />*/}
                        {/*<IconButton disabled={advanced} onClick={decrement} icon={<ArrowDownIcon />} />*/}
                    </div>
                )}

                <WrappedInput
                    disabled={linked}
                    className={classes.input}
                    description={right.label}
                    value={right.value}
                    onChange={getUpdateValue(`${valueKey}.${right.key}`)}
                />
                <WrappedInput
                    disabled={linked}
                    className={classes.input}
                    description={bottom.label}
                    value={bottom.value}
                    onChange={getUpdateValue(`${valueKey}.${bottom.key}`)}
                />
                <WrappedInput
                    disabled={linked}
                    className={classes.input}
                    description={left.label}
                    value={left.value}
                    onChange={getUpdateValue(`${valueKey}.${left.key}`)}
                />
                <IconButton
                    className={classNames(classes.linkSettings, {
                        [classes.linkSettingsActive]: linked
                    })}
                    onClick={() => setLinked(!linked)}
                    icon={<LinkIcon />}
                />
            </Cell>
        </Grid>
    );
};

export default React.memo(BoxInputs);
