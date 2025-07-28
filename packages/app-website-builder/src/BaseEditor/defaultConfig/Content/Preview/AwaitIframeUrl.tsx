import React from "react";
import { useIframeUrl } from "~/BaseEditor/defaultConfig/Content/Preview/useIframeUrl";

interface AwaitIframeUrlProps {
    children: (params: { url: string }) => React.ReactNode;
}

export const AwaitIframeUrl = ({ children }: AwaitIframeUrlProps) => {
    const url = useIframeUrl();

    return url ? <>{children({ url })}</> : null;
};
