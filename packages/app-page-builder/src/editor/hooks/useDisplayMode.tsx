import React, { useCallback, useMemo } from "react";
import {
    setDisplayModeMutation,
    setPagePreviewDimensionMutation,
    PagePreviewDimension
} from "~/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useUI } from "~/editor/hooks/useUI";
import { DisplayMode, PbEditorResponsiveModePlugin } from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";

export type DisplayModeConfig = PbEditorResponsiveModePlugin["config"];

export interface UseDisplayMode {
    displayMode: DisplayMode;
    displayModes: DisplayModeConfig[];
    config: PbEditorResponsiveModePlugin["config"];
    setDisplayMode: (mode: DisplayMode) => void;
    setPagePreviewDimensions: (dimensions: PagePreviewDimension) => void;
}

export function useDisplayMode(): UseDisplayMode {
    const {
        responsiveDisplayMode: { setDisplayMode: pbSetDisplayMode }
    } = usePageBuilder();

    // Get current displayMode (string value)
    const [{ displayMode }, setUiValue] = useUI();

    const editorDisplayModes = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .map(pl => pl.config);
    }, []);

    const memoizedDisplayMode = useMemo(() => {
        return editorDisplayModes.find(dp => dp.displayMode === displayMode);
    }, [editorDisplayModes, displayMode]);

    const setDisplayMode = useCallback(
        (mode: DisplayMode) => {
            /**
             * We are updating the "displayMode" in PageBuilder context.
             * Because "ElementRoot" needs its value to apply "visibility" element style setting.
             */
            pbSetDisplayMode(mode);

            setUiValue(prev => setDisplayModeMutation(prev, mode));
        },
        [displayMode]
    );

    const setPagePreviewDimensions = useCallback(
        (dimensions: PagePreviewDimension) =>
            setUiValue(prev => setPagePreviewDimensionMutation(prev, dimensions)),
        [displayMode]
    );

    if (!memoizedDisplayMode) {
        return {
            config: {
                displayMode,
                tooltip: {
                    title: "",
                    subTitle: "",
                    body: ""
                },
                icon: <></>
            },
            displayMode,
            displayModes: editorDisplayModes,
            setDisplayMode,
            setPagePreviewDimensions
        };
    }

    return {
        displayMode,
        displayModes: editorDisplayModes,
        config: memoizedDisplayMode,
        setDisplayMode,
        setPagePreviewDimensions
    };
}
