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

/** An `<img>` backed by the auth-gated run-image route, with loading and failure placeholders. */
export const RunImage = ({ runId, imageRef, alt, className, onOpen }: Props) => {
    const { src, loading, failed } = useRunImage(runId, imageRef);

    if (loading) {
        return <div className={`${className ?? ""} bg-neutral-light animate-pulse`} />;
    }
    if (failed || !src) {
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
