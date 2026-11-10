import React from "react";
import { cn } from "@webiny/admin-ui";

export interface CommandRowLayoutProps {
    icon?: React.ReactNode;
    /** Tints the glyph orange: the AI sparkle is the one icon that does. */
    accent?: boolean;
    title: React.ReactNode;
    description?: React.ReactNode;
    /** A tag, a label or a shortcut at the end of the row. */
    trailing?: React.ReactNode;
}

/**
 * The inside of a palette row, shared by command rows and the rows that are plain buttons, such as
 * the AI suggestions.
 *
 * A row with a description puts its icon on a 32px tile; one without uses a bare glyph and is 40px
 * tall. The tile turns white on the selected row, which is grey, so the two stay apart. The trailing
 * slot is as tall as the icon, so selecting a row never changes its height.
 *
 * The icons come from menus and commands at their own sizes and colours; the slot sets both. The
 * colour goes on the svg itself, because an `<Icon>` carries its own fill class and would otherwise
 * win over the slot's.
 */
export const CommandRowLayout = ({
    icon,
    accent,
    title,
    description,
    trailing
}: CommandRowLayoutProps) => {
    const rich = Boolean(description);

    return (
        <div
            className={cn(
                "flex items-center gap-sm-extra px-sm-extra py-sm",
                !rich && "min-h-[40px]"
            )}
        >
            {icon ? (
                <span
                    aria-hidden
                    className={cn(
                        "grid shrink-0 place-items-center [&_svg]:size-md-plus",
                        accent ? "[&_svg]:fill-accent-default" : "[&_svg]:fill-neutral-xstrong",
                        rich && "size-xl rounded-md bg-neutral-light",
                        rich && "group-data-[selected=true]/row:bg-neutral-base"
                    )}
                >
                    {icon}
                </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-xxs">
                <span className="truncate text-md text-neutral-primary">{title}</span>
                {rich ? (
                    <span className="truncate text-sm text-neutral-strong">{description}</span>
                ) : null}
            </span>
            <span className="flex h-md-plus shrink-0 items-center gap-sm">{trailing}</span>
        </div>
    );
};
