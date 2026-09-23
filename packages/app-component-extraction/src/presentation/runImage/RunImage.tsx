import React from "react";
import { useRunImage } from "./useRunImage.js";

interface Props {
    runId: string;
    imageRef: string | null | undefined;
    alt: string;
    className?: string;
    /** Called when the image is available, so a tile can offer "open full size". */
    onOpen?: (src: string) => void;
}

/**
 * An `<img>` backed by the auth-gated run-image route.
 *
 * A request that failed and an image that was never recorded are shown differently on purpose. They
 * used to render the same "no image" placeholder, and a full-page screenshot too large for the
 * delivery route to return then looked exactly like a page that had no screenshot — or like
 * segmentation having produced nothing. Saying which it is costs a line and makes the next occurrence
 * legible instead of mysterious.
 */
export const RunImage = ({ runId, imageRef, alt, className, onOpen }: Props) => {
    const { src, loading, failed, error } = useRunImage(runId, imageRef);

    if (loading) {
        return <div className={`${className ?? ""} bg-neutral-light animate-pulse`} />;
    }
    if (failed) {
        return (
            <div
                className={`${className ?? ""} flex flex-col items-center justify-center gap-xxs bg-neutral-light p-sm text-center text-sm text-destructive-primary`}
                title={error ?? undefined}
            >
                <span>Preview unavailable</span>
                <span className="text-neutral-strong">{error}</span>
            </div>
        );
    }
    if (!src) {
        return (
            <div
                className={`${className ?? ""} bg-neutral-light flex items-center justify-center text-neutral-strong text-sm`}
            >
                no image
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            className={`${className ?? ""} ${onOpen ? "cursor-pointer" : ""}`}
            onClick={onOpen ? () => onOpen(src) : undefined}
        />
    );
};
