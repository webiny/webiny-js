import React from "react";
import { useWcp } from "@webiny/app-wcp";

interface CanUsePrivateFilesProps {
    children: React.ReactNode;
}

function CanUsePrivateFiles({ children }: CanUsePrivateFilesProps) {
    const wcp = useWcp();

    return wcp.canUsePrivateFiles() ? <>{children}</> : null;
}

export const Wcp = {
    CanUsePrivateFiles
};
