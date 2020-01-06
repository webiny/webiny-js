import * as React from "react";
declare type Props = {
    label?: React.ReactNode;
    size: number;
    spinnerColor: string;
    spinnerWidth: number;
    visible: boolean;
};
declare const CircularProgress: {
    ({ label, size, spinnerWidth, spinnerColor, visible }: Props): JSX.Element;
    defaultProps: {
        size: number;
        spinnerColor: string;
        spinnerWidth: number;
        visible: boolean;
    };
};
export default CircularProgress;
