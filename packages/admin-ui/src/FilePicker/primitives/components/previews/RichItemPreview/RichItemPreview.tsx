import React from "react";
import bytes from "bytes";
import { cn, makeDecoratable } from "~/utils.js";
import { Text } from "~/Text/index.js";
import { RichItemThumbnail } from "./RichItemThumbnail.js";
import { ThumbnailActions } from "./ThumbnailActions.js";
import { ItemDescription } from "../ItemDescription.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";
import { TruncatedFileName } from "../TruncatedFileName.js";
import { previewVariants } from "../variants.js";
import type { FilePreviewDefaultProps } from "../../types.js";

type RichItemPreviewProps = FilePreviewDefaultProps & {
    preview?: "thumbnail" | "file-type" | "placeholder";
    /** Optional custom image renderer for the thumbnail (e.g. a cropped preview). */
    renderImage?: (args: { url: string; name: string }) => React.ReactNode;
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
    renderImage,
    ...props
}: RichItemPreviewProps) => {
    const actions = { onRemoveItem, onReplaceItem, onEditItem, disabled };

    const formattedSize = value.size
        ? bytes.format(value.size, { unitSeparator: " ", decimalPlaces: 0 })
        : "";
    const details = [value.mimeType, formattedSize].filter(Boolean).join(" - ");

    return (
        <div
            data-testid="image-preview"
            className={cn(
                "w-full rounded-md @container",
                previewVariants({ variant, disabled }),
                className
            )}
            {...props}
        >
            {/* Stacked layout for narrow containers (below 280px). */}
            <div data-role="select-image" className={"@min-[280px]:hidden"}>
                <div className={"flex flex-col gap-xs p-xs"}>
                    <div className={"group relative cursor-pointer"} onClick={onReplaceItem}>
                        <RichItemThumbnail
                            {...value}
                            variant={"banner"}
                            disabled={disabled}
                            preview={preview}
                            renderImage={renderImage}
                        />
                        <ThumbnailActions {...actions} />
                    </div>

                    <div className={"flex flex-col gap-xxs min-w-0 px-xxs pb-xxs"}>
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
                </div>
            </div>

            {/* Side-by-side layout for wider containers (280px+). */}
            <div
                data-role="select-image"
                className={"hidden @min-[280px]:flex items-center gap-sm-extra min-w-0"}
            >
                <div className={"shrink-0 cursor-pointer"} onClick={onReplaceItem}>
                    <RichItemThumbnail
                        {...value}
                        disabled={disabled}
                        preview={preview}
                        renderImage={renderImage}
                    />
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
