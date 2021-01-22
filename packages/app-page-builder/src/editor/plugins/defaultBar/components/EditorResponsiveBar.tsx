import React, { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import { plugins } from "@webiny/plugins";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { PbEditorResponsiveModePlugin } from "../../../../types";
import { uiAtom, setDisplayModeMutation } from "../../../recoil/modules";
import { updateConnectedValue } from "../../../recoil/modules/connected";

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

const EditorResponsiveBar = () => {
    const { displayMode, pagePreviewDimension } = useRecoilValue(uiAtom);
    const setEditorMode = useCallback(
        displayMode => {
            updateConnectedValue(uiAtom, prev => setDisplayModeMutation(prev, displayMode));
        },
        [uiAtom]
    );

    const responsiveBarContent = useMemo(() => {
        const editorModes = plugins.byType<PbEditorResponsiveModePlugin>(
            "pb-editor-responsive-mode"
        );
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
    }, [setEditorMode]);

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

export default EditorResponsiveBar;
