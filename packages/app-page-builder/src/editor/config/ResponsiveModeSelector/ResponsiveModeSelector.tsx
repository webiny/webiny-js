import React, { useCallback, useEffect, useMemo } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { plugins } from "@webiny/plugins";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { PbEditorResponsiveModePlugin } from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { isPerBreakpointStylesObject } from "@webiny/app-page-builder-elements/utils";
import { useUI } from "~/editor/hooks/useUI";
import { setDisplayModeMutation } from "~/editor/recoil/modules";

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

export const ResponsiveModeSelector: React.FC = () => {
    const [{ displayMode, pagePreviewDimension }, setUiValue] = useUI();
    const {
        responsiveDisplayMode: { setDisplayMode }
    } = usePageBuilder();

    const setEditorMode = useCallback(
        displayMode => {
            setUiValue(prev => setDisplayModeMutation(prev, displayMode));
            /**
             * We are updating the "displayMode" in PageBuilder context.
             * Because "ElementRoot" needs its value to apply "visibility" element style setting.
             */
            setDisplayMode(displayMode);
        },
        [displayMode]
    );

    const editorModes = useMemo(
        () => plugins.byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode"),
        []
    );

    const pageElements = usePageElements();
    if (pageElements) {
        // By default, we want to only assign styles for the first breakpoint in line, which is "desktop".
        // We only care about tablet, mobile-landscape, and mobile-portrait if user selects one of those.
        useEffect(() => {
            pageElements.setAssignStylesCallback(params => {
                const whitelistedBreakpoints = [];
                for (let i = 0; i < editorModes.length; i++) {
                    const current = editorModes[i];
                    whitelistedBreakpoints.push(current.config.displayMode);
                    if (current.config.displayMode === displayMode) {
                        break;
                    }
                }

                const { breakpoints, styles = {}, assignTo = {} } = params;
                if (isPerBreakpointStylesObject({ breakpoints, styles })) {
                    for (const breakpointName in breakpoints) {
                        if (
                            styles[breakpointName] &&
                            whitelistedBreakpoints.includes(breakpointName)
                        ) {
                            Object.assign(assignTo, styles[breakpointName]);
                        }
                    }
                } else {
                    Object.assign(assignTo, styles);
                }

                return assignTo;
            });
        }, [displayMode]);
    }

    const responsiveBarContent = useMemo(() => {
        return editorModes.map(({ config: { displayMode: mode, icon, toolTip } }) => {
            return (
                <Tooltip
                    key={mode}
                    content={
                        <div className={classes.tooltip}>
                            <div className={"tooltip__title"}>
                                <Typography use={"subtitle1"}>{toolTip.title}</Typography>
                            </div>
                            <div className={"tooltip__info"}>
                                {toolTip.subTitleIcon}
                                <Typography use={"body2"}>{toolTip.subTitle}</Typography>
                            </div>
                            <div className={"tooltip__body"}>
                                <Typography use={"body2"}>{toolTip.body}</Typography>
                            </div>
                        </div>
                    }
                    placement={"bottom"}
                    className={classNames("action-wrapper", {
                        active: mode === displayMode
                    })}
                >
                    <IconButton icon={icon} onClick={() => setEditorMode(mode)} />
                </Tooltip>
            );
        });
    }, [setEditorMode, displayMode]);

    return (
        <div className={classes.wrapper}>
            {responsiveBarContent}
            <div className={classes.dimensionIndicator}>
                <span className="width">
                    <Typography use={"subtitle2"}>{pagePreviewDimension.width}</Typography>
                    <Typography use={"subtitle2"}>PX</Typography>
                </span>
                <span className="height">
                    <Typography use={"subtitle2"}>{"100"}</Typography>
                    <Typography use={"subtitle2"}>%</Typography>
                </span>
            </div>
        </div>
    );
};
