import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { previewVariants } from "../variants.js";
import type { FilePreviewDefaultProps } from "../../types.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";

type ImagePreviewProps = FilePreviewDefaultProps & {
    /**
     * Optional custom image renderer. Lets a consumer render, e.g., a cropped /
     * focal-point-aware thumbnail while keeping all of the preview chrome. When
     * omitted (or it returns a falsy value) a plain `<img>` is rendered.
     */
    renderImage?: (args: { url: string; name: string; className: string }) => React.ReactNode;
};

const IMAGE_CLASS = "object-contain size-full";

const DecoratableImagePreview = ({
    value,
    className,
    variant,
    disabled,
    onRemoveItem,
    onReplaceItem,
    onEditItem,
    renderImage
}: ImagePreviewProps) => {
    let image: React.ReactElement | React.ReactNode = (
        <img src={value.url} alt={value.name} className={IMAGE_CLASS} />
    );

    if (typeof renderImage === "function") {
        image = renderImage({ url: value.url, name: value.name, className: IMAGE_CLASS });
    }

    return (
        <div
            className={cn(
                "flex justify-center items-center py-sm rounded-md relative",
                previewVariants({ variant }),
                className
            )}
            data-testid={"image-preview"}
        >
            <div
                className={"cursor-pointer size-[128px] flex justify-center items-center"}
                data-role={"select-image"}
                onClick={onReplaceItem}
            >
                {image}
            </div>
            <div className={"absolute top-1 right-1.5"}>
                <ItemActions
                    onRemoveItem={onRemoveItem}
                    onEditItem={onEditItem}
                    disabled={disabled}
                    className={"flex-col"}
                />
            </div>
        </div>
    );
};

const ImagePreview = makeDecoratable("FileImagePreview", DecoratableImagePreview);

export { ImagePreview, type ImagePreviewProps };
