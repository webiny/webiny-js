import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { previewVariants } from "../variants.js";
import type { FilePreviewDefaultProps } from "../../types.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";

type ImagePreviewProps = FilePreviewDefaultProps;

const DecoratableImagePreview = ({
    value,
    className,
    variant,
    disabled,
    onRemoveItem,
    onReplaceItem,
    onEditItem
}: ImagePreviewProps) => {
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
                className={
                    "cursor-pointer size-[128px] flex justify-center items-center"
                }
                data-role={"select-image"}
                onClick={onReplaceItem}
            >
                <img
                    src={value.url}
                    alt={value.name}
                    className={"object-contain size-full"}
                />
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
