import React from "react";
import styled from "@emotion/styled";

export type SimpleOverlayProps = { showOverlay: boolean };
export const SimpleOverlay = styled<"div", SimpleOverlayProps>("div")(({ showOverlay }) => ({
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: showOverlay ? "rgba(0, 0, 0, 0.32)" : "transparent",
    transition: "150ms all ease-in-out",
    pointerEvents: showOverlay ? "auto" : "none",
    zIndex: showOverlay ? 5 : -1,
    opacity: showOverlay ? 1 : 0
}));

export type SimpleModalWrapperProps = { showOverlay: boolean };
export const SimpleModalWrapper = styled<"div", SimpleModalWrapperProps>("div")(
    ({ showOverlay }) => ({
        position: "absolute",
        top: "0px",
        left: "50%",
        width: "90%",
        height: "auto",
        maxWidth: "426px",
        maxHeight: "520px",
        overflow: "auto",
        backgroundColor: "var(--mdc-theme-surface)",
        boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.12)",
        borderRadius: "0px 0px 4px 4px",
        transition: "150ms opacity ease-in-out",
        pointerEvents: showOverlay ? "auto" : "none",
        zIndex: showOverlay ? 5 : -1,
        opacity: showOverlay ? 1 : 0,
        transform: showOverlay ? "translateX(-50%)" : "none",

        "& .input-wrapper": {
            paddingBottom: "16px"
        },

        "& .simple-modal__footer": {
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            "& .mdc-button": {
                borderRadius: 4,
                padding: "0px 32px"
            },
            "& .simple-modal__footer__action--secondary": {
                color: "var(--mdc-theme-text-primary-on-background)",
                border: "1px solid var(--mdc-theme-on-background)"
            },
            "& .simple-modal__footer__action--primary": {
                backgroundColor: "var(--mdc-theme-secondary)"
            }
        }
    })
);

export type SimpleModalProps = {
    /*
     * This function is called whenever the user hits "Escape" or clicks outside the dialog.
     * It's important to close the dialog "onDismiss".
     */
    onDismiss?: (event?: React.SyntheticEvent) => void;
    /*
     * Controls whether or not the dialog is open.
     */
    isOpen: boolean;
    /*
     * Accepts any renderable content.
     */
    children: React.ReactNode;
};

export const SimpleModal = ({ onDismiss, isOpen, children }: SimpleModalProps) => {
    return (
        <React.Fragment>
            <SimpleOverlay
                onClick={e => {
                    e.stopPropagation();
                    onDismiss();
                }}
                showOverlay={isOpen}
            />
            <SimpleModalWrapper showOverlay={isOpen}>{children}</SimpleModalWrapper>
        </React.Fragment>
    );
};
