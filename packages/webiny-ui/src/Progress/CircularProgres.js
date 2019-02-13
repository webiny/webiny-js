// This is just to center the spinner
import * as React from "react";
import styled from "react-emotion";

import Spinner from "react-spinner-material";

type Props = {
    size: number,
    spinnerColor: string,
    spinnerWidth: number,
    visible: boolean
};

const defaultProps = {
    size: 45,
    spinnerColor: "#fa5723",
    spinnerWidth: 4,
    visible: true
};

const SpinnerWrapper = styled("div")({
    width: "100%",
    height: "100%",
    position: "absolute",
    background: "white",
    opacity: 0.92,
    top: 0,
    left: 0,
    zIndex: 10,
    "> div": {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
    }
});

const CircularProgress = (props: Props) => {
    return (
        <SpinnerWrapper>
            <div>
                <Spinner {...defaultProps} {...props} />
            </div>
        </SpinnerWrapper>
    );
};

export default CircularProgress;
