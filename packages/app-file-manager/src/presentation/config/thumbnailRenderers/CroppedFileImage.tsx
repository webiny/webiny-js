import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Image } from "@webiny/app/components/index.js";
import { cn, getCroppedImageRenderStyles } from "@webiny/admin-ui";
import type { FileItem } from "~/domain/types.js";

interface CroppedFileImageProps {
    file: FileItem;
    /** Width passed to the delivery transform (`?width=`). */
    width: number;
    /** How the (cropped) image fits its slot. */
    fit: "cover" | "contain";
    /** Class applied to the `<Image>` when there is no crop (original behavior). */
    fallbackClassName?: string;
}

const isFullCrop = (crop: any): boolean => {
    return !crop || (crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0);
};

/**
 * Renders a File Manager image thumbnail/preview honoring the saved crop (and, for
 * `cover`, the hotspot). Falls back to the plain image when the file has no crop,
 * so un-edited files render exactly as before.
 */
export const CroppedFileImage = ({
    file,
    width,
    fit,
    fallbackClassName
}: CroppedFileImageProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState({ w: 0, h: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        const measure = () => {
            const rect = el.getBoundingClientRect();
            setBox({ w: rect.width, h: rect.height });
        };
        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const edit = file.metadata?.imageEdit;
    const imageWidth = file.metadata?.image?.width ?? 0;
    const imageHeight = file.metadata?.image?.height ?? 0;

    if (isFullCrop(edit?.crop) || imageWidth <= 0 || imageHeight <= 0) {
        return (
            <Image
                src={file.src}
                alt={file.name}
                transform={{ width }}
                className={fallbackClassName}
            />
        );
    }

    const { wrapper, image } = getCroppedImageRenderStyles(
        imageWidth,
        imageHeight,
        edit?.crop,
        edit?.hotspot,
        {
            boxWidth: box.w,
            boxHeight: box.h,
            fit
        }
    );

    return (
        <div
            ref={ref}
            className={cn("flex h-full w-full items-center justify-center overflow-hidden")}
        >
            <div style={wrapper}>
                <Image src={file.src} alt={file.name} transform={{ width }} style={image} />
            </div>
        </div>
    );
};
