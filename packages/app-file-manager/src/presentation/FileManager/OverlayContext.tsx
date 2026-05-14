import React, { createContext, useContext } from "react";
import type { FmFile } from "~/features/shared/types.js";

export interface OverlayConfig {
    onFileClick: (file: FmFile) => void;
    confirmSelection: () => void;
    onClose: () => void;
    accept: string[];
    multiple: boolean;
}

const OverlayCtx = createContext<OverlayConfig | null>(null);

export const OverlayProvider = ({
    config,
    children
}: {
    config: OverlayConfig;
    children: React.ReactNode;
}) => {
    return <OverlayCtx.Provider value={config}>{children}</OverlayCtx.Provider>;
};

export function useOverlay(): OverlayConfig | null {
    return useContext(OverlayCtx);
}
