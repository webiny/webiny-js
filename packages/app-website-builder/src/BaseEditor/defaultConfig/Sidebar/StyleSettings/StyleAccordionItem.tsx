import React, { useState } from "react";
import { Collapsible } from "radix-ui";
import { ReactComponent as ChevronIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { Icon } from "@webiny/admin-ui";

export interface StyleAccordionItemProps {
    title: string;
    icon?: React.ReactElement;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export const StyleAccordionItem = ({
    title,
    icon,
    defaultOpen = false,
    children
}: StyleAccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible.Root defaultOpen={defaultOpen} onOpenChange={setIsOpen}>
            <Collapsible.Trigger asChild>
                <div
                    role="button"
                    tabIndex={0}
                    className={
                        "w-full flex items-center justify-between py-sm cursor-pointer select-none rounded-lg " +
                        (isOpen ? "" : "bg-neutral-subtle")
                    }
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.currentTarget.click();
                        }
                    }}
                >
                    <div className={"flex items-center gap-sm"}>
                        {icon && (
                            <Icon
                                icon={icon}
                                label={title}
                                size={"md"}
                                color={isOpen ? "accent" : "neutral-light"}
                            />
                        )}
                        <span
                            className={
                                "text-md text-neutral-primary " + (isOpen ? "font-semibold" : "")
                            }
                        >
                            {title}
                        </span>
                    </div>
                    <Icon
                        icon={<ChevronIcon />}
                        label={"Toggle"}
                        size={"md"}
                        color={"neutral-strong"}
                        className={"transition-transform " + (isOpen ? "rotate-180" : "")}
                    />
                </div>
            </Collapsible.Trigger>
            <Collapsible.Content
                className={
                    "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
                }
            >
                <div className={"px-sm pb-lg"}>{children}</div>
            </Collapsible.Content>
        </Collapsible.Root>
    );
};
