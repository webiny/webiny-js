import React, { useRef, useEffect, useCallback, useState } from "react";
import { Messenger, MessageOrigin } from "@webiny/cms-sdk/messenger";
import { jsonPatch } from "@webiny/cms-sdk";
import {
    Alert,
    CopyButton,
    IconButton,
    OverlayLoader,
    SegmentedControl,
    Text,
    Tooltip,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as LaptopIcon } from "@webiny/icons/laptop.svg";
import { ReactComponent as SmartphoneIcon } from "@webiny/icons/smartphone.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { PreviewDomainMenu } from "@webiny/frontend-settings/exports/admin.js";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";
import { buildEditorUrl, buildDisplayUrl } from "./resolvePreviewUrl.js";

/**
 * How long to wait for the frontend to report it is ready before showing troubleshooting hints.
 */
const READY_TIMEOUT_MS = 20_000;

interface PreviewPaneProps {
    domain: string;
    /**
     * The Frontend Domain setting, passed only when the user overrides it with their own preview domain.
     */
    settingsDomain: string | null;
    onResetDomain: () => void;
    previewPath: string;
    entryId: string;
    entryData: Record<string, unknown> | null;
    /**
     * Entry data used to resolve the preview path, with referenced entries' values filled in.
     */
    urlEntryData: Record<string, unknown> | null;
}

type ViewportMode = "desktop" | "mobile";

export const PreviewPane = ({
    domain,
    settingsDomain,
    onResetDomain,
    previewPath,
    entryId,
    entryData,
    urlEntryData
}: PreviewPaneProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const messengerRef = useRef<Messenger | null>(null);
    const entryDataRef = useRef(entryData);
    const lastSentDataRef = useRef<Record<string, unknown> | null>(null);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timedOut, setTimedOut] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [viewport, setViewport] = useState<ViewportMode>("desktop");
    const presenter = useLivePreviewPresenter();
    const { showToast } = useToast();

    entryDataRef.current = entryData;

    const displayUrl = buildDisplayUrl(domain, previewPath, urlEntryData || {});

    const iframeSrc = (() => {
        const editorPath = buildEditorUrl(domain, previewPath);
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

        setLoading(true);
        setTimedOut(false);
        const timeout = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);

        messenger.on("preview.ready", () => {
            clearTimeout(timeout);
            setReady(true);
            setLoading(false);
            setTimedOut(false);
            sendEntryData();
        });

        messenger.on(
            "preview.component.register",
            (manifest: { name: string; label: string; description: string }) => {
                presenter.addComponent(manifest);
            }
        );

        return () => {
            clearTimeout(timeout);
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

    const confirmCopy = useCallback(() => {
        showToast({ title: "Preview link copied to clipboard!" });
    }, []);

    const openInNewTab = useCallback(() => {
        window.open(getDraftUrl(), "_blank");
    }, [getDraftUrl]);

    return (
        <div className="relative border border-neutral-dimmed rounded-t-lg flex flex-col flex-1 h-full overflow-hidden">
            <div className="flex flex-row items-center gap-sm p-sm bg-neutral-base border-b-sm border-neutral-dimmed">
                <div className="relative flex-auto min-w-0 h-[32px]">
                    <div className="w-full absolute -top-px py-xs-plus pl-xl pr-[112px] border-sm text-md truncate cursor-not-allowed rounded-md border-neutral-subtle bg-neutral-disabled text-neutral-disabled">
                        <PreviewDomainMenu className={"absolute left-0 top-0"} />
                        {displayUrl}
                    </div>
                    <div className="absolute right-0 top-0 flex">
                        <Tooltip
                            content={<Text size="md">Refresh preview</Text>}
                            side="bottom"
                            trigger={
                                <IconButton
                                    icon={<RefreshIcon />}
                                    size="md"
                                    onClick={reload}
                                    variant={"ghost"}
                                />
                            }
                        />
                        <Tooltip
                            content={<Text size="md">Copy preview link</Text>}
                            side="bottom"
                            trigger={
                                <CopyButton
                                    size="md"
                                    value={getDraftUrl()}
                                    onCopy={confirmCopy}
                                    variant={"ghost"}
                                />
                            }
                        />
                        <Tooltip
                            content={<Text size="md">Preview entry in a new tab</Text>}
                            side="bottom"
                            trigger={
                                <IconButton
                                    icon={<OpenInNewIcon />}
                                    size="md"
                                    onClick={openInNewTab}
                                    variant={"ghost"}
                                />
                            }
                        />
                    </div>
                </div>
                <div className="shrink-0">
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

            {settingsDomain ? (
                <Alert
                    type={"warning"}
                    variant={"subtle"}
                    className={"rounded-none"}
                    actions={<Alert.Action text={"Use Frontend Domain"} onClick={onResetDomain} />}
                >
                    Previewing on your custom domain {domain} instead of the Frontend Domain{" "}
                    {settingsDomain}.
                </Alert>
            ) : null}

            {loading && timedOut ? (
                <Alert
                    type={"warning"}
                    variant={"subtle"}
                    className={"rounded-none"}
                    actions={<Alert.Action text={"Reload"} onClick={reload} />}
                >
                    {new URL(iframeSrc).origin} is not responding to the live preview. Check that
                    the frontend app is running at that address, that it initializes the Webiny SDK
                    in editing mode, and that it allows this admin app as a referrer.
                </Alert>
            ) : null}

            <div className="relative block box-border h-full w-full overflow-auto fill-grid">
                {loading && !timedOut ? (
                    <OverlayLoader text="Connecting to Live Preview..." />
                ) : null}
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
