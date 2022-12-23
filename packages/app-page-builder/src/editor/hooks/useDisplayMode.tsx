import React, { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { uiAtom, setDisplayModeMutation } from "~/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useUI } from "~/editor/hooks/useUI";
import { DisplayMode, PbEditorResponsiveModePlugin } from "~/types";

export interface UseDisplayMode {
    displayMode: DisplayMode;
    config: PbEditorResponsiveModePlugin["config"];
    setDisplayMode: (mode: DisplayMode) => void;
}

export function useDisplayMode(): UseDisplayMode {
    // Get current displayMode (string value)
    const { displayMode } = useRecoilValue(uiAtom);
    const [, setUiValue] = useUI();

    const memoizedDisplayMode = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const setDisplayMode = useCallback(
        (mode: DisplayMode) => {
            setUiValue(prev => setDisplayModeMutation(prev, mode));
        },
        [displayMode]
    );

    if (!memoizedDisplayMode) {
        return {
            config: {
                displayMode,
                toolTip: {
                    title: "",
                    subTitle: "",
                    body: ""
                },
                icon: <></>
            },
            displayMode,
            setDisplayMode
        };
    }
    const { config } = memoizedDisplayMode;

    return { displayMode, config, setDisplayMode };
}
