import React from "react";
import ModalComponent from "./Components/ModalComponent";

export default function withModalDialog() {
    return Target => {
        const ModalDialogHOC = ({ children, ...props }) => {
            return (
                <ModalComponent {...props}>
                    {dialogProps => (
                        <Target {...props} {...dialogProps}>
                            {children}
                        </Target>
                    )}
                </ModalComponent>
            );
        };

        ModalDialogHOC.displayName = "ModalDialogHOC";

        return ModalDialogHOC;
    };
}
