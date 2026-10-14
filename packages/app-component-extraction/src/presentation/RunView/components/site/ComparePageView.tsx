import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, IconButton, Loader, SegmentedControl, Text } from "@webiny/admin-ui";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { useRunImage } from "~/presentation/runImage/useRunImage.js";
import { compareFrames } from "./compareFrames.js";

interface Props {
    runId: string;
    title: string;
    /** The original page, on the source site. */
    sourceUrl: string;
    /** The generated page, on the website. */
    generatedUrl: string;
    /** The source page's full-page capture, whose size gives the frames their height. */
    screenshotRef: string | undefined;
    onClose: () => void;
}

const GAP = 16;

/** The capture's natural size, read off the image once it has loaded. */
const useImageSize = (src: string | null) => {
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    useEffect(() => {
        if (!src) {
            return;
        }
        const image = new Image();
        image.onload = () => setSize({ width: image.naturalWidth, height: image.naturalHeight });
        image.src = src;
    }, [src]);
    return size;
};

const Column = ({
    label,
    url,
    frames,
    capture,
    showCapture,
    onShowCapture
}: {
    label: string;
    url: string;
    frames: ReturnType<typeof compareFrames>;
    /** The page's captured screenshot, offered in place of the live page; null where there is none. */
    capture?: string | null;
    showCapture?: boolean;
    onShowCapture?: (show: boolean) => void;
}) => (
    <div className="flex min-w-0 flex-col gap-xs" style={{ width: frames.columnWidth }}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-sm bg-neutral-subtle py-xs">
            <div className="flex min-w-0 flex-col">
                <Text
                    size="sm"
                    className="font-semibold uppercase tracking-wide text-neutral-strong"
                >
                    {label}
                </Text>
                <Text size="sm" className="truncate font-mono text-neutral-muted" title={url}>
                    {url}
                </Text>
            </div>
            <div className="flex flex-none items-center gap-xs">
                {capture && onShowCapture ? (
                    /*
                     * A site can refuse to be shown inside another page (X-Frame-Options, or a CSP
                     * frame-ancestors list that leaves the admin out), and the browser then shows
                     * "refused to connect" with nothing the admin can read to know it happened. The
                     * capture always shows, and is the height the frames are sized from.
                     */
                    <SegmentedControl
                        // Dimmed: the light track is the header's own colour, and reads as two buttons.
                        variant="dimmed"
                        value={showCapture ? "capture" : "live"}
                        onChange={(value: string) => onShowCapture(value === "capture")}
                        items={[
                            { value: "live", label: "Live page" },
                            { value: "capture", label: "Capture" }
                        ]}
                    />
                ) : null}
                <Button
                    variant="tertiary"
                    size="sm"
                    icon={<OpenInNewIcon />}
                    text="Open"
                    onClick={() => window.open(url, "_blank", "noopener")}
                />
            </div>
        </div>
        <div
            className="relative overflow-hidden rounded-sm border border-solid border-neutral-dimmed bg-neutral-base"
            style={{ width: frames.columnWidth, height: frames.columnHeight }}
        >
            {showCapture && capture ? (
                <img src={capture} alt={`${label}, as captured`} className="block w-full" />
            ) : (
                <iframe
                    title={label}
                    src={url}
                    referrerPolicy="no-referrer"
                    className="absolute left-0 top-0 origin-top-left border-0"
                    style={{
                        width: frames.frameWidth,
                        height: frames.frameHeight,
                        transform: `scale(${frames.scale})`
                    }}
                />
            )}
        </div>
    </div>
);

/**
 * The original page and the generated page side by side, scrolling together.
 *
 * A frame on another origin can't be scrolled from outside, so the frames aren't kept in step by
 * script: each is as tall as the whole source page, at the width it was captured at, and the two sit
 * in one scroll area. That has a cost the note under the header states: a section sized to the
 * window's height takes the frame's height instead, and a generated page longer than the source
 * scrolls inside its own frame for the rest.
 */
export const ComparePageView = ({
    runId,
    title,
    sourceUrl,
    generatedUrl,
    screenshotRef,
    onClose
}: Props) => {
    const capture = useRunImage(runId, screenshotRef);
    const size = useImageSize(capture.src);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [available, setAvailable] = useState(0);
    // The capture by default: it always shows, where a live page can be refused inside a frame.
    const [showCapture, setShowCapture] = useState(true);

    useLayoutEffect(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }
        const measure = () => {
            const style = getComputedStyle(element);
            setAvailable(
                element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
            );
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Without a capture the height is a guess; with one still loading, wait for it.
    const waiting = Boolean(screenshotRef) && !capture.failed && !size;
    const frames = compareFrames(available, GAP, size);

    // Above the admin's sidebar (z-sidebar), below its dialogs, tooltips and toasts.
    return (
        <div className="fixed inset-0 z-overlay flex flex-col bg-neutral-subtle">
            <div className="flex items-center justify-between gap-md border-b border-solid border-neutral-dimmed bg-neutral-base px-lg py-sm-extra">
                <div className="flex min-w-0 flex-col gap-xxs">
                    <Text className="truncate font-semibold text-neutral-primary">
                        Compare page: {title}
                    </Text>
                    <Text size="sm" className="text-neutral-muted">
                        {size
                            ? "Both at 1440px wide, scrolling together, as tall as the original page. A longer page scrolls inside its own frame for the rest."
                            : "The original page's height isn't known, so both frames are 4000px tall. A longer page scrolls inside its own frame for the rest."}{" "}
                        The original shows its capture; switch to Live page to load it. If that says
                        &ldquo;refused to connect&rdquo;, the site won&apos;t be shown inside
                        another page: open it instead.
                    </Text>
                </div>
                <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="md"
                    aria-label="Close"
                    onClick={onClose}
                />
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-lg pb-lg">
                {waiting || available === 0 ? (
                    <div className="flex items-center justify-center gap-sm py-xl">
                        <Loader size="sm" />
                        <Text size="sm" className="text-neutral-strong">
                            Reading the original page&apos;s height…
                        </Text>
                    </div>
                ) : (
                    <div className="flex items-start" style={{ gap: GAP }}>
                        <Column
                            label="Original"
                            url={sourceUrl}
                            frames={frames}
                            capture={capture.src}
                            showCapture={showCapture}
                            onShowCapture={setShowCapture}
                        />
                        <Column label="Generated" url={generatedUrl} frames={frames} />
                    </div>
                )}
            </div>
        </div>
    );
};
