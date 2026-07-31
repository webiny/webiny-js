import type { ReactNode } from "react";
import * as React from "react";
import { DropdownMenu } from "radix-ui";

export function DropDownItem({
    children,
    className,
    onClick,
    title
}: {
    children: React.ReactNode;
    className: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
}) {
    return (
        <button className={className} onClick={onClick} title={title} type="button">
            {children}
        </button>
    );
}

interface DropDownProps {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    children: ReactNode;
    stopCloseOnClickSelf?: boolean;
    showScroll?: boolean;
}

export function DropDown({
    disabled = false,
    buttonLabel,
    buttonAriaLabel,
    buttonClassName,
    buttonIconClassName,
    children,
    showScroll = true
}: DropDownProps): React.JSX.Element {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    style={{ position: "relative" }}
                    disabled={disabled}
                    aria-label={buttonAriaLabel || buttonLabel}
                    className={buttonClassName}
                >
                    {buttonIconClassName && <span className={buttonIconClassName} />}
                    {buttonLabel && (
                        <span className="text dropdown-button-text">{buttonLabel}</span>
                    )}
                    <i className="chevron-down" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className={`lexical-dropdown z-overlay ${showScroll ? "" : "no-scroll"}`}
                    sideOffset={4}
                    collisionPadding={8}
                    onCloseAutoFocus={e => e.preventDefault()}
                >
                    <div
                        className={showScroll ? "lexical-dropdown-scroll" : ""}
                        style={showScroll ? { maxHeight: 250, overflowY: "auto" } : undefined}
                    >
                        {children}
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
