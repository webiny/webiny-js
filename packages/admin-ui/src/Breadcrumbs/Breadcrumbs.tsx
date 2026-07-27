import React from "react";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as SeparatorIcon } from "@webiny/icons/keyboard_arrow_right.svg";
import { cn, makeDecoratable } from "~/utils.js";

export interface BreadcrumbsItem {
    /**
     * Text label of the breadcrumb. Omitted for the leading home item, which is icon-only.
     */
    label?: string;
    /**
     * Leading icon. Used by the home item; other items typically render text only. Sized and
     * colored by the breadcrumb — pass the raw icon component (e.g. `<HomeIcon />`).
     */
    icon?: React.ReactNode;
    /**
     * Full, untruncated text used as the item's `title` (native tooltip). Defaults to `label`.
     */
    title?: string;
    /**
     * Navigates when the item is activated. Omitted (or on the current item) renders a
     * non-interactive item.
     */
    onClick?: () => void;
    /**
     * Marks the current location — the last item in the trail. Rendered with stronger text
     * and never interactive, per the design system's breadcrumb guidelines.
     */
    current?: boolean;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
    items: BreadcrumbsItem[];
}

const itemTextClassName =
    "block max-w-[150px] truncate text-sm leading-none tracking-normal whitespace-nowrap";

// The material glyphs default their `fill` to `currentColor`, so the surrounding text color
// (muted / primary / hover) drives the icon color too.
const glyphClassName = "size-md shrink-0 fill-current";

const renderGlyph = (icon: React.ReactNode) => {
    if (!React.isValidElement(icon)) {
        return icon;
    }
    const element = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(element, {
        className: cn(glyphClassName, element.props.className)
    });
};

const BreadcrumbItem = ({ item }: { item: BreadcrumbsItem }) => {
    const interactive = Boolean(item.onClick) && !item.current;
    const title = item.title ?? item.label;

    const content = (
        <span className="flex items-center gap-xs">
            {item.icon ? renderGlyph(item.icon) : null}
            {item.label ? <span className={itemTextClassName}>{item.label}</span> : null}
        </span>
    );

    // The current (active) item and any item without an action render as plain text.
    if (!interactive) {
        return (
            <span
                aria-current={item.current ? "page" : undefined}
                title={title}
                className={cn(
                    "flex items-center rounded-sm px-xxs py-none",
                    item.current ? "text-neutral-primary" : "text-neutral-muted"
                )}
            >
                {content}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={item.onClick}
            title={title}
            className={cn(
                "flex items-center rounded-sm px-xxs py-none",
                "text-neutral-muted transition-colors",
                "hover:bg-neutral-light hover:text-neutral-strong",
                "focus-visible:outline-none focus-visible:ring-sm focus-visible:ring-primary-dimmed"
            )}
        >
            {content}
        </button>
    );
};

const BreadcrumbSeparator = () => {
    return (
        <span aria-hidden="true" className="flex items-center text-neutral-muted">
            <SeparatorIcon className={glyphClassName} />
        </span>
    );
};

const BreadcrumbsBase = ({ items, className, ...props }: BreadcrumbsProps) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center", className)} {...props}>
            <ol className="flex items-center gap-none">
                {items.map((item, index) => {
                    // A stable-enough key: labels are unique within a trail; index breaks ties.
                    const key = `${item.label ?? "home"}-${index}`;
                    return (
                        <li key={key} className="flex items-center">
                            {index > 0 ? <BreadcrumbSeparator /> : null}
                            <BreadcrumbItem item={item} />
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

const Breadcrumbs = makeDecoratable("Breadcrumbs", BreadcrumbsBase);

/**
 * Convenience factory for the leading, icon-only home entry.
 */
export const createHomeBreadcrumbItem = (onClick?: () => void): BreadcrumbsItem => ({
    icon: <HomeIcon />,
    title: "Home",
    onClick
});

export { Breadcrumbs };
