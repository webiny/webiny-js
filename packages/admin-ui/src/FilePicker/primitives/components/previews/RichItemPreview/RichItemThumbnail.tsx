import React from "react";
import { ReactComponent as PlaceholderIcon } from "@webiny/icons/image.svg";
import type { FileItemFormatted } from "~/FilePicker/index.js";
import { Icon } from "~/Icon/index.js";
import { cn } from "~/utils.js";
import type { RichItemPreviewProps } from "~/FilePicker/primitives/components/index.js";

import csvThumb from "../assets/csv.svg";
import docThumb from "../assets/doc.svg";
import docxThumb from "../assets/docx.svg";
import fileThumb from "../assets/file.svg";
import pdfThumb from "../assets/pdf.svg";
import pptThumb from "../assets/ppt.svg";
import pptxThumb from "../assets/pptx.svg";
import txtThumb from "../assets/txt.svg";
import xlsThumb from "../assets/xls.svg";
import xlsxThumb from "../assets/xlsx.svg";

type RichItemThumbnailProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> &
    FileItemFormatted & {
        preview?: RichItemPreviewProps["preview"];
        disabled?: boolean;
        /**
         * `tile` is the fixed square that sits beside the file details; `banner` spans the full
         * width of a stacked layout, where the panel is too narrow to afford a column for it.
         */
        variant?: "tile" | "banner";
    };

type ThumbnailProps = Pick<FileItemFormatted, "url" | "name"> & {
    fit: "cover" | "contain";
};

const Thumbnail = ({ url, name, fit }: ThumbnailProps) => {
    if (fit === "contain") {
        return (
            <div className={"size-full p-xs bg-neutral-muted flex items-center justify-center"}>
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

type FileTypeProps = Pick<FileItemFormatted, "mimeType" | "name">;

const FileType = ({ mimeType = "", name }: FileTypeProps) => {
    const getMimeTypeSrc = (mimeType: string) => {
        switch (mimeType) {
            case "text/csv": // .csv
                return csvThumb;
            case "application/msword": // .doc
                return docThumb;
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
                return docxThumb;
            case "application/pdf": // .pdf
                return pdfThumb;
            case "application/vnd.ms-powerpoint": // .ppt
                return pptThumb;
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation": // .pptx
                return pptxThumb;
            case "text/plain": // .txt
                return txtThumb;
            case "application/vnd.ms-excel": // .xls
                return xlsThumb;
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
                return xlsxThumb;
            default:
                return fileThumb;
        }
    };

    return (
        <img
            src={getMimeTypeSrc(mimeType)}
            alt={name}
            className="size-full object-contain p-sm-extra"
        />
    );
};

type PlaceholderProps = Pick<FileItemFormatted, "name">;

const Placeholder = ({ name }: PlaceholderProps) => {
    return (
        <div className={"size-full flex justify-center items-center bg-transparent"}>
            <Icon icon={<PlaceholderIcon />} label={name} size={"lg"} color={"neutral-light"} />
        </div>
    );
};

const RichItemThumbnail = ({
    url,
    name,
    className,
    mimeType,
    preview,
    disabled,
    variant = "tile"
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
                <Thumbnail url={url} name={name} fit={variant === "banner" ? "contain" : "cover"} />
            ) : preview === "placeholder" ? (
                <Placeholder name={name} />
            ) : (
                <FileType mimeType={mimeType} name={name} />
            )}
        </div>
    );
};

export { RichItemThumbnail, type RichItemThumbnailProps };
