import React from "react";
import bytes from "bytes";
import { cn, makeDecoratable } from "~/utils.js";
import { Text } from "~/Text/index.js";
import { RichItemThumbnail } from "./RichItemThumbnail.js";
import { ItemDescription } from "../ItemDescription.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";
import { ItemTextActions } from "../ItemTextActions.js";
import { TruncatedFileName } from "../TruncatedFileName.js";
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
    const actions = { onRemoveItem, onReplaceItem, onEditItem, disabled };

    // Type and size share a line of their own beneath the name, so the name gets the full width
    // and the two secondary facts read as one group rather than crowding it.
    const formattedSize = value.size
        ? bytes.format(value.size, { unitSeparator: " ", decimalPlaces: 0 })
        : "";
    const details = [value.mimeType, formattedSize].filter(Boolean).join(" - ");

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
            {/* Two layouts, chosen by the preview's own width rather than the viewport's, because
                the same component renders in a ~200px sidebar and in a wide form field. Below
                280px a side-by-side row cannot give the file name a readable share of the width,
                so everything stacks and the actions spell themselves out instead. */}
            <div data-role="select-image" className={"@min-[280px]:hidden"}>
                <div className={"flex flex-col gap-xs p-xs"}>
                    <div className={"cursor-pointer"} onClick={onReplaceItem}>
                        <RichItemThumbnail
                            {...value}
                            variant={"banner"}
                            disabled={disabled}
                            preview={preview}
                        />
                    </div>

                    <div className={"flex flex-col gap-xxs min-w-0 px-xxs"}>
                        <TruncatedFileName
                            name={value.name}
                            className={disabled ? "text-neutral-disabled" : "text-neutral-primary"}
                        />
                        {details ? (
                            <Text
                                size="sm"
                                className={cn(
                                    "truncate",
                                    disabled ? "text-neutral-disabled" : "text-neutral-muted"
                                )}
                            >
                                {details}
                            </Text>
                        ) : null}
                    </div>

                    <ItemTextActions {...actions} className={"px-xxs pb-xxs"} />
                </div>
            </div>

            <div
                data-role="select-image"
                className={"hidden @min-[280px]:flex items-center gap-sm-extra min-w-0"}
            >
                <div className={"shrink-0 cursor-pointer"} onClick={onReplaceItem}>
                    <RichItemThumbnail {...value} disabled={disabled} preview={preview} />
                </div>

                <ItemDescription
                    item={value}
                    disabled={disabled}
                    onClick={onReplaceItem}
                    className={"grow basis-0 cursor-pointer"}
                />

                <ItemActions {...actions} className={"ml-auto pr-sm-extra"} />
            </div>
        </div>
    );
};

const RichItemPreview = makeDecoratable("RichItemPreview", DecoratableRichItemPreview);

export { RichItemPreview, type RichItemPreviewProps };
