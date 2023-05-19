/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as React from "react";

type DropDownContextType = {
    registerItem: (ref: React.RefObject<HTMLButtonElement>) => void;
};

const DropDownContext = React.createContext<DropDownContextType | null>(null);

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
    const ref = useRef<HTMLButtonElement>(null);

    const dropDownContext = React.useContext(DropDownContext);

    if (dropDownContext === null) {
        throw new Error("DropDownItem must be used within a DropDown");
    }

    const { registerItem } = dropDownContext;

    useEffect(() => {
        if (ref && ref.current) {
            registerItem(ref);
        }
    }, [ref, registerItem]);

    return (
        <button className={className} onClick={onClick} ref={ref} title={title} type="button">
            {children}
        </button>
    );
}

function DropDownItems({
    children,
    dropDownRef,
    showScroll = true,
    onClose
}: {
    children: React.ReactNode;
    dropDownRef?: React.Ref<HTMLDivElement>;
    showScroll?: boolean;
    onClose: () => void;
}) {
    const [items, setItems] = useState<React.RefObject<HTMLButtonElement>[]>();
    const [highlightedItem, setHighlightedItem] = useState<React.RefObject<HTMLButtonElement>>();

    const registerItem = useCallback(
        (itemRef: React.RefObject<HTMLButtonElement>) => {
            setItems(prev => (prev ? [...prev, itemRef] : [itemRef]));
        },
        [setItems]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!items) {
            return;
        }

        const key = event.key;

        if (["Escape", "ArrowUp", "ArrowDown", "Tab"].includes(key)) {
            event.preventDefault();
        }

        if (key === "Escape" || key === "Tab") {
            onClose();
        } else if (key === "ArrowUp") {
            setHighlightedItem(prev => {
                if (!prev) {
                    return items[0];
                }
                const index = items.indexOf(prev) - 1;
                return items[index === -1 ? items.length - 1 : index];
            });
        } else if (key === "ArrowDown") {
            setHighlightedItem(prev => {
                if (!prev) {
                    return items[0];
                }
                return items[items.indexOf(prev) + 1];
            });
        }
    };

    const contextValue = useMemo(
        () => ({
            registerItem
        }),
        [registerItem]
    );

    useEffect(() => {
        if (items && !highlightedItem) {
            setHighlightedItem(items[0]);
        }

        if (highlightedItem && highlightedItem.current) {
            highlightedItem.current.focus();
        }
    }, [items, highlightedItem]);

    return (
        <DropDownContext.Provider value={contextValue}>
            <div
                className={`lexical-dropdown ${showScroll ? "" : "no-scroll"}`}
                ref={dropDownRef}
                onKeyDown={handleKeyDown}
            >
                {children}
            </div>
        </DropDownContext.Provider>
    );
}

export function DropDown({
    disabled = false,
    buttonLabel,
    buttonAriaLabel,
    buttonClassName,
    buttonIconClassName,
    children,
    stopCloseOnClickSelf,
    showScroll = true
}: {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    children: ReactNode;
    stopCloseOnClickSelf?: boolean;
    showScroll?: boolean;
}): JSX.Element {
    const dropDownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    // Used to prevent flickering of the dropdown while calculating the dropdown position.
    const [positionIsCalculated, setPositionIsCalculated] = useState(false);
    const [showDropDown, setShowDropDown] = useState(false);

    const handleClose = () => {
        setPositionIsCalculated(false);
        setShowDropDown(false);
        if (buttonRef && buttonRef.current) {
            buttonRef.current.focus();
        }
    };

    useEffect(() => {
        const button = buttonRef.current;
        const dropDown = dropDownRef.current;

        if (showDropDown && button && dropDown) {
            dropDown.style.top = "44px";
            dropDown.style.left = `${button.offsetLeft}px`;
            setPositionIsCalculated(true);
        }
    }, [dropDownRef, buttonRef, showDropDown]);

    useEffect(() => {
        const button = buttonRef.current;
        if (button && showDropDown) {
            const handle = (event: MouseEvent) => {
                const target = event.target;
                if (stopCloseOnClickSelf) {
                    if (dropDownRef.current && dropDownRef.current.contains(target as Node)) {
                        return;
                    }
                }

                if (!button.contains(target as Node)) {
                    setShowDropDown(false);
                }
            };
            document.addEventListener("click", handle);
            return () => {
                document.removeEventListener("click", handle);
            };
        }
        return;
    }, [dropDownRef, buttonRef, showDropDown, stopCloseOnClickSelf]);

    const displayContainer = useMemo(() => {
        // To prevent blinking, we show the container only when the dropdown position is calculated.
        // Without this, window would be visible first on left (0px), and after a millisecond on the right side.
        return positionIsCalculated ? { display: "block" } : { display: "none" };
    }, [positionIsCalculated]);

    return (
        <>
            <button
                style={{ position: "relative" }}
                disabled={disabled}
                aria-label={buttonAriaLabel || buttonLabel}
                className={buttonClassName}
                onClick={() => setShowDropDown(!showDropDown)}
                ref={buttonRef}
            >
                {buttonIconClassName && <span className={buttonIconClassName} />}
                {buttonLabel && <span className="text dropdown-button-text">{buttonLabel}</span>}
                <i className="chevron-down" />
            </button>
            {showDropDown && (
                <div className={"lexical-dropdown-container"} style={displayContainer}>
                    <DropDownItems
                        showScroll={showScroll}
                        dropDownRef={dropDownRef}
                        onClose={handleClose}
                    >
                        {children}
                    </DropDownItems>
                </div>
            )}
        </>
    );
}
