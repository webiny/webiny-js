import React, { useContext } from "react";
import styled from "@emotion/styled";
import { DataListModalOverlayContext } from "./DataListModalOverlayContext";

export type SimpleOverlayProps = { showOverlay: boolean };
export const SimpleOverlay = styled.div<SimpleOverlayProps>(({ showOverlay }) => ({
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

export interface DataListModalWrapperProps {
    showOverlay: boolean;
}

export const DataListModalWrapper = styled.div<DataListModalWrapperProps>(({ showOverlay }) => ({
    position: "absolute",
    top: "0px",
    left: "50%",
    width: "90%",
    height: "auto",
    maxWidth: "426px",
    maxHeight: "520px",
    overflow: "visible",
    backgroundColor: "var(--mdc-theme-surface)",
    boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.12)",
    borderRadius: "0px 0px 4px 4px",
    transition: "150ms opacity ease-in-out",
    pointerEvents: showOverlay ? "auto" : "none",
    zIndex: showOverlay ? 5 : -1,
    opacity: showOverlay ? 1 : 0,
    transform: showOverlay ? "translateX(-50%)" : "translateX(-1000px)",

    "& .input-wrapper": {
        paddingBottom: "16px"
    },

    "& .datalist-modal__footer": {
        padding: "24px",
        display: "flex",
        justifyContent: "space-between",
        "& .mdc-button": {
            borderRadius: 4,
            padding: "0px 32px"
        },
        "& .datalist-modal__footer__action--secondary": {
            color: "var(--mdc-theme-text-primary-on-background)",
            border: "1px solid var(--mdc-theme-on-background)"
        },
        "& .datalist-modal__footer__action--primary": {
            backgroundColor: "var(--mdc-theme-secondary)"
        }
    }
}));

export interface DataListModalOverlayProps {
    /*
     * This function is called after closing the modal overlay.
     */
    onDismiss?: (event?: React.SyntheticEvent) => void;

    children: React.ReactNode;
}

export const DataListModalOverlay = ({ onDismiss, children }: DataListModalOverlayProps) => {
    const { isOpen, setIsOpen } = useContext(DataListModalOverlayContext);
    return (
        <React.Fragment>
            <SimpleOverlay
                onClick={e => {
                    e.stopPropagation();
                    // Close the modal.
                    setIsOpen(false);

                    if (typeof onDismiss === "function") {
                        onDismiss();
                    }
                }}
                showOverlay={isOpen}
            />
            <DataListModalWrapper showOverlay={isOpen} data-testid={"data-list-modal-wrapper"}>
                {children}
            </DataListModalWrapper>
        </React.Fragment>
    );
};
