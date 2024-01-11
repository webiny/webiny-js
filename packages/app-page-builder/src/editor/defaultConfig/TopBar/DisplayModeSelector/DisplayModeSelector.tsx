import React, { useMemo } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { PbEditorResponsiveModePlugin, DisplayMode } from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { useUI } from "~/editor/hooks/useUI";
import { useDisplayMode } from "~/editor/recoil/modules";

const classes = {
    wrapper: css({
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        "& .action-wrapper": {
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRight: "1px solid var(--mdc-theme-background)",
            "&:first-child": {
                borderLeft: "1px solid var(--mdc-theme-background)"
            },
            "&.active": {
                backgroundColor: "var(--mdc-theme-background)",
                "& .mdc-icon-button": {
                    color: "var(--mdc-theme-text-primary-on-background)"
                }
            }
        }
    }),
    dimensionIndicator: css({
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0px 16px",
        borderRight: "1px solid var(--mdc-theme-background)",

        "& span": {
            color: "var(--mdc-theme-text-primary-on-background)"
        },
        "& .width": {
            marginRight: 8,
            "& span:last-child": {
                marginLeft: 4
            }
        },
        "& .height": {
            "& span:last-child": {
                marginLeft: 4
            }
        }
    }),
    tooltip: css({
        textAlign: "left",
        textTransform: "initial",
        "& .tooltip__title": {
            "& span": {
                fontWeight: 900
            }
        },
        "& .tooltip__info": {
            display: "flex",
            "& span": {
                fontWeight: 600
            },
            "& svg": {
                fill: "var(--mdc-theme-surface)",
                marginRight: 4
            }
        },
        "& .tooltip__body": {
            marginTop: 4,
            "& span": {
                fontWeight: 600
            }
        }
    })
};

export const DisplayModeSelector = () => {
    const { displayMode, displayModes, setDisplayMode } = useDisplayMode();

    const responsiveBarContent = useMemo(() => {
        return displayModes.map(({ displayMode: mode, icon, tooltip }) => {
            return (
                <Tooltip
                    key={mode}
                    content={
                        <div className={classes.tooltip}>
                            <div className={"tooltip__title"}>
                                <Typography use={"subtitle1"}>{tooltip.title}</Typography>
                            </div>
                            <div className={"tooltip__info"}>
                                {tooltip.subTitleIcon}
                                <Typography use={"body2"}>{tooltip.subTitle}</Typography>
                            </div>
                            <div className={"tooltip__body"}>
                                <Typography use={"body2"}>{tooltip.body}</Typography>
                            </div>
                        </div>
                    }
                    placement={"bottom"}
                    className={classNames("action-wrapper", {
                        active: mode === displayMode
                    })}
                >
                    <IconButton icon={icon} onClick={() => setDisplayMode(mode as DisplayMode)} />
                </Tooltip>
            );
        });
    }, [setDisplayMode, displayMode]);

    return <div className={classes.wrapper}>{responsiveBarContent}</div>;
};
