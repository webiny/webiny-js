import React from "react";
import type { FileItemFormatted } from "~/FilePicker/index.js";

type ThumbnailProps = Pick<FileItemFormatted, "url" | "name"> & {
    fit: "cover" | "contain";
    renderImage?: (args: { url: string; name: string }) => React.ReactNode;
};

const Thumbnail = ({ url, name, fit, renderImage }: ThumbnailProps) => {
    const customImage = typeof renderImage === "function" ? renderImage({ url, name }) : false;

    if (fit === "contain") {
        return (
            <div className={"size-full p-xs bg-neutral-muted flex items-center justify-center"}>
                {customImage || (
                    <img src={url} alt={name} className={"max-h-full max-w-full rounded-xs"} />
                )}
            </div>
        );
    }

    return (
        <div className={"size-full bg-neutral-muted"}>
            {customImage || <img src={url} alt={name} className={"size-full object-cover"} />}
        </div>
    );
};

export { Thumbnail, type ThumbnailProps };
