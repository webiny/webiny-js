import React from "react";
import type { FileItemFormatted } from "~/FilePicker/index.js";

type ThumbnailProps = Pick<FileItemFormatted, "url" | "name"> & {
    fit: "cover" | "contain";
};

/**
 * The file's own image. `cover` fills its box and crops what does not fit, which suits the small
 * square tile; `contain` shows the whole picture, which suits the banner.
 */
const Thumbnail = ({ url, name, fit }: ThumbnailProps) => {
    if (fit === "contain") {
        // No backdrop of its own: a contained image does not fill its box, so a fill here reads as
        // a second panel inside the preview - and the preview's own hover already shifts the
        // surface behind it. `cover` keeps one, but only ever sees it while the image loads.
        return (
            <div className={"size-full p-xs flex items-center justify-center"}>
                {/*
                    Capping the element with max-width/max-height, rather than stretching it and
                    letting `object-contain` letterbox the picture inside it, keeps the element box
                    and the visible picture the same rectangle. That is what lets the corners round
                    at all: `border-radius` clips the element, so on a letterboxed image it would
                    trim empty space and leave the picture square.
                */}
                <img src={url} alt={name} className={"max-h-full max-w-full rounded-xs"} />
            </div>
        );
    }

    return (
        <div className={"size-full bg-neutral-muted"}>
            <img src={url} alt={name} className={"size-full object-cover"} />
        </div>
    );
};

export { Thumbnail, type ThumbnailProps };
