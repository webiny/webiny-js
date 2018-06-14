import React from "react";
import BaseCropper from "./BaseCropper";

export default function withBaseCropper() {
    return Target => {
        const BaseCropperHOC = ({ children, ...props }) => {
            return (
                <BaseCropper {...props}>
                    {cropperProps => (
                        <Target {...props} {...cropperProps}>
                            {children}
                        </Target>
                    )}
                </BaseCropper>
            );
        };

        BaseCropperHOC.displayName = "BaseCropperHOC";

        return BaseCropperHOC;
    };
}
