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
                "@container w-full rounded-md",
                previewVariants({ variant, disabled }),
                className
            )}
            {...props}
        >
            {/* The preview is laid out against its own width, not the viewport's. Narrow first:
                the details wrap onto a full-width line below the thumbnail and the actions,
                because the 56px thumbnail plus two action buttons leave the file name too little
                room to be readable (e.g. in the Website Builder style sidebar). From 280px up,
                everything fits on a single line. */}
            <div
                data-role="select-image"
                className={cn(
                    "flex flex-wrap items-center gap-x-sm-extra gap-y-xxs min-w-0 pb-xs",
                    "@min-[280px]:flex-nowrap @min-[280px]:pb-0"
                )}
            >
                <div className={"shrink-0 cursor-pointer"} onClick={onReplaceItem}>
                    <RichItemThumbnail {...value} disabled={disabled} preview={preview} />
                </div>

                <ItemDescription
                    item={value}
                    disabled={disabled}
                    onClick={onReplaceItem}
                    className={cn(
                        "order-last basis-full px-xs cursor-pointer",
                        "@min-[280px]:order-none @min-[280px]:basis-0 @min-[280px]:grow @min-[280px]:px-0"
                    )}
                />

                <ItemActions
                    onRemoveItem={onRemoveItem}
                    onReplaceItem={onReplaceItem}
                    onEditItem={onEditItem}
                    disabled={disabled}
                    className={"ml-auto pr-sm-extra"}
                />
            </div>
        </div>
    );
};

const RichItemPreview = makeDecoratable("RichItemPreview", DecoratableRichItemPreview);

export { RichItemPreview, type RichItemPreviewProps };
