import React from "react";
import ModalConfirmationComponent from "./Components/ModalConfirmationComponent";

export default function withModalConfirmation() {
    return Target => {
        const ModalConfirmationHOC = ({ children, ...props }) => {
            return (
                <ModalConfirmationComponent {...props}>
                    {confirmationProps => (
                        <Target {...props} {...confirmationProps}>
                            {children}
                        </Target>
                    )}
                </ModalConfirmationComponent>
            );
        };

        ModalConfirmationHOC.displayName = "ModalConfirmationHOC";

        return ModalConfirmationHOC;
    };
}
