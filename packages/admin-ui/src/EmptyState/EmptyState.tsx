import React from "react";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils.js";
import { Text } from "~/Text/index.js";
import {
    ContentIllustration,
    LayoutIllustration,
    ListingIllustration,
    SelectIllustration,
    TableIllustration,
    UploadIllustration
} from "./illustrations/index.js";

const ILLUSTRATIONS = {
    content: ContentIllustration,
    table: TableIllustration,
    listing: ListingIllustration,
    layout: LayoutIllustration,
    upload: UploadIllustration,
    select: SelectIllustration
};

type EmptyStateType = keyof typeof ILLUSTRATIONS;

const emptyStateVariants = cva(
    "w-full flex flex-col items-center justify-center text-center px-lg",
    {
        variants: {
            size: {
                sm: "gap-md py-[56px]",
                md: "gap-md-plus py-[80px]",
                lg: "gap-lg py-[96px]"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

// Illustration dimensions per size. Set as explicit SVG `width`/`height` so the
// rendered size is deterministic and doesn't depend on Tailwind generating
// arbitrary width/height utilities for consumers.
const ILLUSTRATION_DIMENSIONS = {
    sm: { width: 88, height: 73 },
    md: { width: 145, height: 120 },
    lg: { width: 181, height: 150 }
} as const;

const contentVariants = cva(
    "flex flex-col items-center w-full text-neutral-strong [word-break:break-word]",
    {
        variants: {
            size: {
                sm: "gap-sm",
                md: "gap-sm",
                lg: "gap-sm-extra"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

// The title scales up at the largest size; the description shrinks at the smallest.
const TITLE_SIZE = { sm: "lg", md: "lg", lg: "xl" } as const;
const DESCRIPTION_SIZE = { sm: "sm", md: "md", lg: "md" } as const;

interface EmptyStateProps
    extends
        Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
        VariantProps<typeof emptyStateVariants> {
    // The illustration that best matches the empty context.
    type?: EmptyStateType;
    title?: React.ReactNode;
    description?: React.ReactNode;
    // Whether to render the illustration. Defaults to `true`.
    illustration?: boolean;
    // Optional call-to-action buttons, rendered below the text.
    actions?: React.ReactNode;
}

const DecoratableEmptyState = ({
    size = "md",
    type = "content",
    title,
    description,
    illustration = true,
    actions,
    className,
    ...props
}: EmptyStateProps) => {
    const resolvedSize = size ?? "md";
    const Illustration = ILLUSTRATIONS[type];

    return (
        <div className={cn(emptyStateVariants({ size: resolvedSize }), className)} {...props}>
            {illustration ? (
                <Illustration
                    className={"shrink-0"}
                    width={ILLUSTRATION_DIMENSIONS[resolvedSize].width}
                    height={ILLUSTRATION_DIMENSIONS[resolvedSize].height}
                    aria-hidden={true}
                />
            ) : null}
            {title || description ? (
                <div className={contentVariants({ size: resolvedSize })}>
                    {title ? (
                        <Text
                            as={"div"}
                            size={TITLE_SIZE[resolvedSize]}
                            className={"font-semibold max-w-[520px]"}
                        >
                            {title}
                        </Text>
                    ) : null}
                    {description ? (
                        <Text
                            as={"div"}
                            size={DESCRIPTION_SIZE[resolvedSize]}
                            className={"max-w-[600px]"}
                        >
                            {description}
                        </Text>
                    ) : null}
                </div>
            ) : null}
            {actions ? (
                <div className={"flex items-center justify-center gap-sm-extra"}>{actions}</div>
            ) : null}
        </div>
    );
};

const EmptyState = makeDecoratable("EmptyState", DecoratableEmptyState);

export { EmptyState, type EmptyStateProps, type EmptyStateType };
