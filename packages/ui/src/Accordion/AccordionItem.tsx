import React, { useMemo, useEffect, useState } from "react";
import { Accordion as AdminUiAccordion } from "@webiny/admin-ui";
import { withStaticProps } from "@webiny/admin-ui/utils";

export interface AccordionItemProps {
    /**
     * Element displayed when accordion is expanded.
     */
    children: React.ReactNode;

    /**
     * @deprecated This prop no longer has any effect.
     * Elevation number, default set to 2
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;

    value?: string;

    title?: React.ReactNode;

    description?: React.ReactNode;

    open?: boolean;

    interactive?: boolean;

    handle?: React.ReactNode;

    actions?: React.ReactNode;

    icon?: React.ReactNode;

    /**
     * @deprecated This prop no longer has any effect.
     */
    iconClassName?: string;
}

const AccordionItemBase = (props: AccordionItemProps) => {
    const [open, setOpen] = useState<boolean>(props.open ?? false);

    useEffect(() => {
        setOpen(!!props.open);
    }, [props.open]);

    const icon = useMemo(() => {
        return props.icon ? (
            <AdminUiAccordion.Item.Icon
                icon={props.icon}
                label={typeof props.title === "string" ? props.title : ""}
            />
        ) : null;
    }, [props.icon]);

    return (
        <AdminUiAccordion.Item
            {...props}
            open={open}
            onOpenChange={open => setOpen(open)}
            icon={icon}
            title={props.title || ""}
        >
            {props.children as React.ReactElement}
        </AdminUiAccordion.Item>
    );
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Accordion.Item` component from the `@webiny/admin-ui` package instead.
 */
export const AccordionItem = withStaticProps(AccordionItemBase, {
    Divider: AdminUiAccordion.Item.Action.Separator,
    Action: AdminUiAccordion.Item.Action,
    Icon: AdminUiAccordion.Item.Icon,
    Actions: (props: any) => <>{props.children}</>,
    Element: (props: any) => <div data-role={"accordion-element"} {...props} />
});
