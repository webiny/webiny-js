import React, { useRef, useState } from "react";
import { IconButton } from "webiny/admin/ui";
import { Input } from "webiny/admin/ui";
import { OverlayLoader } from "webiny/admin/ui";
import { ReactComponent as RefreshIcon } from "webiny/admin/icons/refresh.svg";

export interface PreviewProps {
    previewUrl: string;
}

export const PreviewPane = (props: PreviewProps) => {
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState(props.previewUrl);
    const [previewUrl, setPreviewUrl] = useState(props.previewUrl);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const reload = () => {
        const iframe = iframeRef.current;

        if (!iframe) {
            return;
        }

        setLoading(true);
        const newSrc = new URL(iframe.src ?? previewUrl);
        newSrc.searchParams.set("ts", Date.now().toString());

        iframe.src = newSrc.toString();
    };

    const onLoadFinish = (e: any) => {
        setLoading(false);
    };

    const onEnter = () => {
        setPreviewUrl(address);
        setLoading(true);
    };

    return (
        <div className="relative flex flex-col border-r border-gray-300 max-[960px]:hidden flex-1">
            <div className={"flex items-center gap-2 p-2 border-b border-gray-300"}>
                <Input value={address} onChange={setAddress} onEnter={onEnter} size={"md"} />
                <IconButton onClick={reload} icon={<RefreshIcon />} variant="ghost" size="md" />
            </div>
            <div className="block box-border h-full w-full">
                {loading ? <OverlayLoader text={"Connecting to Live Preview..."} /> : null}
                <iframe
                    onLoad={onLoadFinish}
                    ref={ref => {
                        iframeRef.current = ref;
                    }}
                    id={"live-preview-iframe"}
                    sandbox={"allow-same-origin allow-scripts allow-forms"}
                    src={previewUrl}
                    width="100%"
                    height="100%"
                    className="h-full"
                />
            </div>
        </div>
    );
};
