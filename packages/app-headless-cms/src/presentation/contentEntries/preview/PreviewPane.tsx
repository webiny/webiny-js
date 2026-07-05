import React, { useRef, useEffect, useCallback, useState } from "react";
import { Messenger, MessageOrigin } from "@webiny/cms-sdk/messenger";
import { IconButton, Input } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";

interface PreviewPaneProps {
    previewUrl: string;
    entryId: string;
    entryData: Record<string, unknown> | null;
}

export const PreviewPane = ({ previewUrl, entryId, entryData }: PreviewPaneProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const messengerRef = useRef<Messenger | null>(null);
    const entryDataRef = useRef(entryData);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const presenter = useLivePreviewPresenter();

    entryDataRef.current = entryData;

    const getIframeSrc = useCallback(() => {
        const base = previewUrl.endsWith("/") ? previewUrl : previewUrl + "/";
        const url = new URL(entryId, base);
        url.searchParams.set("origin", window.location.origin);
        return url.toString();
    }, [previewUrl, entryId]);

    const iframeSrc = getIframeSrc();

    const sendEntryData = useCallback(() => {
        const data = entryDataRef.current;
        if (data && messengerRef.current) {
            messengerRef.current.send("entry.update", JSON.parse(JSON.stringify(data)));
        }
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) {
            return;
        }

        const targetOrigin = new URL(iframe.src).origin;
        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewTarget = new MessageOrigin(() => iframe.contentWindow!, targetOrigin);

        const messenger = new Messenger(editorOrigin, previewTarget, "cms.preview.*");
        messengerRef.current = messenger;

        messenger.on("preview.ready", () => {
            setReady(true);
            setLoading(false);
            sendEntryData();
        });

        messenger.on(
            "preview.component.register",
            (manifest: { name: string; label: string; description: string }) => {
                presenter.addComponent(manifest);
            }
        );

        return () => {
            messenger.dispose();
            messengerRef.current = null;
            setReady(false);
        };
    }, [iframeSrc, presenter, iframeKey, sendEntryData]);

    useEffect(() => {
        if (!ready || !entryData || !messengerRef.current) {
            return;
        }
        messengerRef.current.send("entry.update", JSON.parse(JSON.stringify(entryData)));
    }, [ready, entryData]);

    const reload = useCallback(() => {
        setLoading(true);
        setReady(false);
        setIframeKey(prev => prev + 1);
    }, []);

    return (
        <div className="relative border border-neutral-dimmed rounded-t-lg flex flex-col flex-1 h-full overflow-hidden">
            <div className="flex p-md items-center bg-white border-b border-neutral-dimmed">
                <div className="w-full p-xs">
                    <Input value={iframeSrc} readOnly size="md" className="bg-gray-100" />
                </div>
                <IconButton onClick={reload} icon={<RefreshIcon />} variant="ghost" size="sm" />
            </div>
            <div className="relative flex-1 overflow-auto">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <span className="text-sm text-neutral-strong">
                            Connecting to Live Preview...
                        </span>
                    </div>
                ) : null}
                <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    src={iframeSrc}
                    className="w-full h-full"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />
            </div>
        </div>
    );
};
