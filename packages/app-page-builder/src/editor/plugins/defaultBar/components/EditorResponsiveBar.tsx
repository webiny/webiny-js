import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import { plugins } from "@webiny/plugins";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { PbEditorResponsiveModePlugin } from "../../../../types";
import { uiAtom, setEditorModeMutation } from "../../../recoil/modules";
import { updateConnectedValue } from "../../../recoil/modules/connected";

const classes = {
    wrapper: css({
        display: "flex",
        justifyContent: "center"
    }),
    button: css({
        "&.mdc-icon-button": {},
        "&.active": {
            color: "var(--mdc-theme-primary)"
        }
    })
};

const EditorResponsiveBar = () => {
    const { editorMode } = useRecoilValue(uiAtom);

    const setEditorMode = useCallback(
        editorMode => {
            updateConnectedValue(uiAtom, prev => setEditorModeMutation(prev, editorMode));
        },
        [uiAtom]
    );

    const editorModes = plugins.byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode");

    return (
        <div className={classes.wrapper}>
            {editorModes.map(({ config: mode }) => {
                return (
                    <Tooltip key={mode.name} content={mode.label} placement={"bottom"}>
                        <IconButton
                            className={classNames(classes.button, {
                                active: editorMode === mode.name
                            })}
                            icon={mode.icon}
                            onClick={() => setEditorMode(mode.name)}
                        />
                    </Tooltip>
                );
            })}
            <div>
                <span>400px</span>
                <span>100%</span>
            </div>
        </div>
    );
};

export default React.memo(EditorResponsiveBar);
