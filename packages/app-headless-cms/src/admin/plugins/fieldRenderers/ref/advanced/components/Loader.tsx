import React from "react";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";

const LoaderContainer = styled("div")({
    display: "flex",
    position: "relative",
    minHeight: "50px"
});
const AbsoluteLoaderContainer = styled("div")({
    display: "flex",
    minHeight: "100%",
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0
});
export const Loader = () => {
    return (
        <LoaderContainer>
            <CircularProgress />
        </LoaderContainer>
    );
};
export const AbsoluteLoader = () => {
    return (
        <AbsoluteLoaderContainer>
            <CircularProgress />
        </AbsoluteLoaderContainer>
    );
};
