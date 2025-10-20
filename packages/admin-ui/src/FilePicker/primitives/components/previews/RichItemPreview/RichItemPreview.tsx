import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { RichItemThumbnail } from "./RichItemThumbnail.js";
import { ItemDescription } from "../ItemDescription.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";
import { previewVariants } from "../variants.js";
import type { FilePreviewDefaultProps } from "../../types.js";

type RichItemPreviewProps = FilePreviewDefaultProps & {
    preview?: "thumbnail" | "file-type" | "placeholder";
};

const DecoratableRichItemPreview = ({
    className,
    disabled,
    onRemoveItem,
    onReplaceItem,
    onEditItem,
    value,
    variant,
    preview,
    ...props
}: RichItemPreviewProps) => {
    return (
        <div
            data-testid="image-preview"
            className={cn(
                "w-full rounded-md",
                previewVariants({ variant, disabled }),
                className
            )}
            {...props}
        >
            <div
                data-role="select-image"
                className="flex items-center justify-between gap-sm-extra min-w-0"
            >
                <div
                    className="flex items-center justify-between flex-1 cursor-pointer gap-sm-extra self-stretch min-w-0"
                    onClick={onReplaceItem}
                >
                    <RichItemThumbnail {...value} disabled={disabled} preview={preview} />
                    <ItemDescription item={value} disabled={disabled} />
                </div>

                <ItemActions
                    onRemoveItem={onRemoveItem}
                    onReplaceItem={onReplaceItem}
                    onEditItem={onEditItem}
                    disabled={disabled}
                    className={"pr-sm-extra"}
                />
            </div>
        </div>
    );
};

const RichItemPreview = makeDecoratable("RichItemPreview", DecoratableRichItemPreview);

export { RichItemPreview, type RichItemPreviewProps };
