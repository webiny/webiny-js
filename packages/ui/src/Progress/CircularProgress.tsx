// This is just to center the spinner
import React from "react";
import styled from "@emotion/styled";
import Spinner from "react-spinner-material";
import { Typography } from "../Typography";

interface CircularProgressProps {
    label?: React.ReactNode;
    size?: number;
    spinnerColor?: string;
    spinnerWidth?: number;
    visible?: boolean;
    style?: React.CSSProperties;
}

const SpinnerWrapper = styled("div")({
    width: "100%",
    height: "100%",
    position: "absolute",
    background: "var(--mdc-theme-surface)",
    opacity: 0.92,
    top: 0,
    left: 0,
    zIndex: 3,
    "& .spinner__inner-wrapper": {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    }
});

const Label = styled("div")({
    marginTop: 15
});

const CircularProgress: React.FC<CircularProgressProps> = props => {
    const { label, size, spinnerWidth, spinnerColor, visible, style } = props;
    /**
     * We can safely cast because we have default props
     */
    return (
        <SpinnerWrapper style={style}>
            <div className={"spinner__inner-wrapper"}>
                <Spinner
                    size={size as number}
                    spinnerColor={spinnerColor as string}
                    spinnerWidth={spinnerWidth as number}
                    visible={visible as boolean}
                />
                {label && (
                    <Label>
                        <Typography use={"overline"}>{label}</Typography>
                    </Label>
                )}
            </div>
        </SpinnerWrapper>
    );
};

CircularProgress.defaultProps = {
    size: 45,
    spinnerColor: "var(--mdc-theme-primary)",
    spinnerWidth: 4,
    visible: true
};

export default CircularProgress;
