import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { DisplayMode, PbEditorResponsiveModePlugin } from "~/types";

export interface UseDisplayMode {
    displayMode: DisplayMode;
    config: PbEditorResponsiveModePlugin["config"];
}

export function useDisplayMode(): UseDisplayMode {
    // Get current displayMode (string value)
    const { displayMode } = useRecoilValue(uiAtom);

    const { config } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    return { displayMode, config };
}
