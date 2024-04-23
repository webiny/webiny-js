import React, { useRef, useState } from "react";

function MenuContainer({
    children,
    menuContainerRef,
    onClose
}: {
    children: React.ReactNode | React.ReactNode[];
    menuContainerRef?: React.Ref<HTMLDivElement>;
    onClose: () => void;
}) {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const key = event.key;

        if (["Escape", "ArrowUp", "ArrowDown", "Tab"].includes(key)) {
            event.preventDefault();
        }

        if (key === "Escape" || key === "Tab") {
            onClose();
        }
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
    };

    return (
        <div style={{ position: "relative" }}>
            <div
                onClick={e => handleContainerClick(e)}
                style={{
                    position: "absolute",
                    top: -10,
                    left: 0,
                    width: 240,
                    backgroundColor: "#fff"
                }}
                ref={menuContainerRef ?? null}
                onKeyDown={handleKeyDown}
            >
                {children}
            </div>
        </div>
    );
}
interface ToolbarActionDialogProps {
    disabled: boolean;
    buttonLabel?: string;
    buttonAriaLabel: string;
    buttonClassName: string;
    buttonIconClassName: string;
    children: React.ReactNode | React.ReactNode[];
}

export const ToolbarActionDialog = ({
    disabled,
    buttonAriaLabel,
    buttonClassName,
    buttonIconClassName,
    buttonLabel,
    children
}: ToolbarActionDialogProps): JSX.Element => {
    const menuWindowRef = useRef<HTMLDivElement>(null);
    const [showDropDown, setShowDropDown] = useState(false);

    const handleClose = () => {
        if (menuWindowRef && menuWindowRef.current) {
            setShowDropDown(false);
            menuWindowRef.current.focus();
        }
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                style={{ position: "relative" }}
                disabled={disabled}
                aria-label={buttonAriaLabel || buttonLabel}
                className={buttonClassName}
                onClick={() => {
                    setShowDropDown(!showDropDown);
                }}
            >
                {buttonIconClassName && <span className={buttonIconClassName} />}
                {buttonLabel && <span className="text dropdown-button-text">{buttonLabel}</span>}
                <i className="chevron-down" />
            </button>
            {showDropDown && <MenuContainer onClose={handleClose}>{children}</MenuContainer>}
        </div>
    );
};
