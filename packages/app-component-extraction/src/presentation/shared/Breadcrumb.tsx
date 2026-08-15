import React from "react";
import { Icon, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as ChevronRightIcon } from "@webiny/icons/chevron_right.svg";

/**
 * A minimal breadcrumb (W9.1 gap #4). admin-ui has no content-area breadcrumb primitive — only the app
 * shell's own nav breadcrumb — so this small one is built from Text + a chevron, for the Create job, Job
 * detail, Stage view and Run inspector headers. The last item is the current page (not a link).
 */

export interface Crumb {
    label: string;
    /** A click handler makes the crumb a link; the last (current) crumb omits it. */
    onClick?: () => void;
}

export const Breadcrumb = ({ items, className }: { items: Crumb[]; className?: string }) => (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-xxs", className)}>
        {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
                <span key={index} className="flex items-center gap-xxs">
                    {item.onClick && !isLast ? (
                        <button
                            type="button"
                            onClick={item.onClick}
                            className="cursor-pointer bg-transparent p-0"
                        >
                            <Text
                                size="sm"
                                className="text-neutral-strong transition-colors hover:text-neutral-primary"
                            >
                                {item.label}
                            </Text>
                        </button>
                    ) : (
                        <Text
                            size="sm"
                            className={isLast ? "text-neutral-primary" : "text-neutral-strong"}
                        >
                            {item.label}
                        </Text>
                    )}
                    {isLast ? null : (
                        <Icon
                            icon={<ChevronRightIcon />}
                            label="/"
                            size="xs"
                            className="[&_svg]:fill-neutral-strong"
                        />
                    )}
                </span>
            );
        })}
    </nav>
);
