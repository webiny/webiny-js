// This is just to center the spinner
import * as React from "react";
import styled from "@emotion/styled";
import Spinner from "react-spinner-material";
import { Typography } from "../Typography";

type Props = {
    label?: React.ReactNode;
    size: number;
    spinnerColor: string;
    spinnerWidth: number;
    visible: boolean;
    style?: React.CSSProperties;
};

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

const CircularProgress = ({ label, size, spinnerWidth, spinnerColor, visible, style }: Props) => {
    return (
        <SpinnerWrapper style={style}>
            <div className={"spinner__inner-wrapper"}>
                <Spinner
                    size={size}
                    spinnerColor={spinnerColor}
                    spinnerWidth={spinnerWidth}
                    visible={visible}
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
    spinnerColor: "#fa5723",
    spinnerWidth: 4,
    visible: true
};

export default CircularProgress;
