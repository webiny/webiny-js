import React, { useRef, useEffect, useCallback, useState } from "react";
import { Messenger, MessageOrigin } from "@webiny/cms-sdk/messenger";
import { jsonPatch } from "@webiny/cms-sdk";
import { IconButton, Input, OverlayLoader, SegmentedControl } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as LaptopIcon } from "@webiny/icons/laptop.svg";
import { ReactComponent as SmartphoneIcon } from "@webiny/icons/smartphone.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";
import { buildEditorUrl, buildDisplayUrl } from "./resolvePreviewUrl.js";

interface PreviewPaneProps {
    previewPrefix: string;
    previewSlug: string;
    entryId: string;
    entryData: Record<string, unknown> | null;
}

type ViewportMode = "desktop" | "mobile";

export const PreviewPane = ({
    previewPrefix,
    previewSlug,
    entryId,
    entryData
}: PreviewPaneProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const messengerRef = useRef<Messenger | null>(null);
    const entryDataRef = useRef(entryData);
    const lastSentDataRef = useRef<Record<string, unknown> | null>(null);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const [viewport, setViewport] = useState<ViewportMode>("desktop");
    const presenter = useLivePreviewPresenter();

    entryDataRef.current = entryData;

    const displayUrl = buildDisplayUrl(previewPrefix, previewSlug, {
        values: (entryData as { values?: Record<string, unknown> } | null)?.values
    });

    const [address, setAddress] = useState(displayUrl);

    useEffect(() => {
        setAddress(displayUrl);
    }, [displayUrl]);

    const iframeSrc = (() => {
        const editorPath = buildEditorUrl(previewPrefix);
        const url = new URL(editorPath);
        url.searchParams.set("wb.editing", "true");
        url.searchParams.set("wb.type", "entry");
        url.searchParams.set("wb.id", entryId);
        url.searchParams.set("wb.path", url.pathname);
        url.searchParams.set("wb.referrer", window.location.origin);
        return url.toString();
    })();

    const sendEntryData = useCallback(() => {
        const data = entryDataRef.current;
        if (!data || !messengerRef.current) {
            return;
        }

        const serialized = JSON.parse(JSON.stringify(data));
        messengerRef.current.send("document.set", serialized);
        lastSentDataRef.current = serialized;
    }, []);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) {
            return;
        }

        const targetOrigin = new URL(iframe.src).origin;
        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewTarget = new MessageOrigin(() => iframe.contentWindow!, targetOrigin);

        const messenger = new Messenger(editorOrigin, previewTarget, "wb.editor.*");
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
            lastSentDataRef.current = null;
            setReady(false);
        };
    }, [iframeSrc, presenter, iframeKey, sendEntryData]);

    useEffect(() => {
        if (!ready || !entryData || !messengerRef.current) {
            return;
        }

        const current = JSON.parse(JSON.stringify(entryData));
        const previous = lastSentDataRef.current;

        if (previous) {
            const patch = jsonPatch.compare(previous, current);
            if (patch.length > 0) {
                messengerRef.current.send("document.patch", patch);
            }
        } else {
            messengerRef.current.send("document.set", current);
        }

        lastSentDataRef.current = current;
    }, [ready, entryData]);

    const reload = useCallback(() => {
        setLoading(true);
        setReady(false);
        lastSentDataRef.current = null;
        setIframeKey(prev => prev + 1);
    }, []);

    const getDraftUrl = useCallback(() => {
        const url = new URL(displayUrl);
        url.searchParams.set("wb.type", "entry");
        url.searchParams.set("wb.path", url.pathname);
        url.searchParams.set("wb.preview", "true");
        url.searchParams.set("wb.id", entryId);
        return url.toString();
    }, [displayUrl, entryId]);

    const copyUrl = useCallback(() => {
        navigator.clipboard.writeText(getDraftUrl());
    }, [getDraftUrl]);

    const openInNewTab = useCallback(() => {
        window.open(getDraftUrl(), "_blank");
    }, [getDraftUrl]);

    return (
        <div className="relative border border-neutral-dimmed rounded-t-lg flex flex-col flex-1 h-full overflow-hidden">
            <div className="flex p-md items-center bg-white border-b border-neutral-dimmed">
                <div className="w-full">
                    <Input
                        value={address}
                        onChange={setAddress}
                        readOnly
                        size="md"
                        variant={"secondary"}
                        className="bg-gray-100"
                    />
                </div>

                <div className="flex items-center gap-xxs ml-sm">
                    <IconButton
                        onClick={openInNewTab}
                        icon={<OpenInNewIcon />}
                        variant="ghost"
                        size="md"
                    />
                    <IconButton
                        onClick={copyUrl}
                        icon={<ContentCopyIcon />}
                        variant="ghost"
                        size="sm"
                    />
                    <IconButton onClick={reload} icon={<RefreshIcon />} variant="ghost" size="sm" />
                    <SegmentedControl
                        value={viewport}
                        onChange={(value: string) => setViewport(value as ViewportMode)}
                        items={[
                            { value: "desktop", label: "", icon: <LaptopIcon /> },
                            { value: "mobile", label: "", icon: <SmartphoneIcon /> }
                        ]}
                    />
                </div>
            </div>

            <div className="block box-border h-full w-full overflow-auto fill-grid">
                {loading ? <OverlayLoader text="Connecting to Live Preview..." /> : null}
                <div
                    className={`mx-auto h-full transition-all duration-300 ${viewport === "mobile" ? "p-md" : ""}`}
                    style={{ width: viewport === "mobile" ? "375px" : "100%" }}
                >
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={iframeSrc}
                        width="100%"
                        height="100%"
                        className="h-full"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                    />
                </div>
            </div>
        </div>
    );
};
