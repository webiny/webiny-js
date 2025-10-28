import React from "react";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { ItemDescription } from "../ItemDescription.js";
import { ItemActions } from "~/FilePicker/primitives/components/previews/ItemActions.js";
import type { FilePreviewDefaultProps } from "../../types.js";
import { previewVariants } from "../variants.js";

const textOnlyPreviewVariants = cva("w-full flex items-center justify-between gap-sm min-w-0", {
    variants: {
        small: {
            true: "px-sm py-xs rounded-xs",
            false: "px-sm py-xs-plus rounded-md"
        }
    },
    defaultVariants: {
        small: false
    }
});

type TextOnlyPreviewProps = FilePreviewDefaultProps &
    React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof previewVariants> &
    VariantProps<typeof textOnlyPreviewVariants>;

const DecoratableTextOnlyPreview = ({
    className,
    disabled,
    onRemoveItem,
    onReplaceItem,
    onEditItem,
    small,
    variant,
    value,
    ...props
}: TextOnlyPreviewProps) => {
    return (
        <div
            data-testid="image-preview"
            className={cn(
                textOnlyPreviewVariants({ small }),
                previewVariants({ variant, disabled }),
                className
            )}
            {...props}
        >
            <div
                data-role="select-image"
                onClick={onReplaceItem}
                className={"overflow-hidden flex-1 min-w-0 cursor-pointer"}
            >
                <ItemDescription item={value} disabled={disabled} small={!!small} />
            </div>
            <ItemActions
                onRemoveItem={onRemoveItem}
                onReplaceItem={onReplaceItem}
                onEditItem={onEditItem}
                small={!!small}
                disabled={disabled}
            />
        </div>
    );
};

const TextOnlyPreview = makeDecoratable("TextOnlyPreview", DecoratableTextOnlyPreview);

export { TextOnlyPreview, type TextOnlyPreviewProps };
