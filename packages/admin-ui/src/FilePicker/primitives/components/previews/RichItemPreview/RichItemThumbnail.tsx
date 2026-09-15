import React from "react";
import type { FileItemFormatted } from "~/FilePicker/index.js";
import { cn } from "~/utils.js";
import type { RichItemPreviewProps } from "~/FilePicker/primitives/components/index.js";
import { FileType } from "./FileType.js";
import { Placeholder } from "./Placeholder.js";
import { Thumbnail } from "./Thumbnail.js";

type RichItemThumbnailProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> &
    FileItemFormatted & {
        preview?: RichItemPreviewProps["preview"];
        disabled?: boolean;
        /**
         * `tile` is the fixed square that sits beside the file details; `banner` spans the full
         * width of a stacked layout, where the panel is too narrow to afford a column for it.
         */
        variant?: "tile" | "banner";
        /** Optional custom image renderer for the thumbnail (e.g. a cropped preview). */
        renderImage?: (args: { url: string; name: string }) => React.ReactNode;
    };

const RichItemThumbnail = ({
    url,
    name,
    className,
    mimeType,
    preview,
    disabled,
    variant = "tile",
    renderImage
}: RichItemThumbnailProps) => {
    const isImage = mimeType?.startsWith("image/");

    return (
        <div
            className={cn(
                "rounded-sm overflow-hidden relative",
                variant === "banner" ? "w-full h-[96px]" : "size-[56px] m-xs",
                disabled && "[&_img]:filter [&_img]:grayscale [&_img]:opacity-50",
                className
            )}
        >
            {preview === "thumbnail" || isImage ? (
                <Thumbnail
                    url={url}
                    name={name}
                    fit={variant === "banner" ? "contain" : "cover"}
                    renderImage={renderImage}
                />
            ) : preview === "placeholder" ? (
                <Placeholder name={name} />
            ) : (
                <FileType mimeType={mimeType} name={name} />
            )}
        </div>
    );
};

export { RichItemThumbnail, type RichItemThumbnailProps };
