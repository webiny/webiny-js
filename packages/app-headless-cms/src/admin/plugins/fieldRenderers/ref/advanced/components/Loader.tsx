import React from "react";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";

const LoaderContainer = styled("div")({
    display: "flex",
    position: "relative",
    minHeight: "50px"
});
export const Loader: React.FC = () => {
    return (
        <LoaderContainer>
            <CircularProgress />
        </LoaderContainer>
    );
};
