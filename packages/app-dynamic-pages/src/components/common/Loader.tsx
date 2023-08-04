import React from "react";
import Spinner from "react-spinner-material";

type LoaderProps = {
    size?: number;
    spinnerWidth?: number;
};

export const Loader: React.FC<LoaderProps> = ({ size, spinnerWidth }) => (
    <Spinner
        size={size || 12}
        spinnerWidth={spinnerWidth || 1}
        spinnerColor={"var(--mdc-theme-primary)"}
        visible={true}
    />
);
