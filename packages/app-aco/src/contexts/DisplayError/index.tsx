import React from "react";
import styled from "@emotion/styled";

const Wrapper = styled("div")({
    display: "flex",
    width: "100%",
    height: "60vh",
    alignItems: "center",
    justifyContent: "center"
});
const Box = styled("div")({
    display: "flex",
    width: "30vw",
    minHeight: "20vh",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--mdc-theme-surface)",
    " > strong": {
        fontWeight: "bold"
    }
});

interface DisplayErrorProps {
    children: React.ReactNode;
}

export const DisplayError = ({ children }: DisplayErrorProps) => {
    return (
        <Wrapper>
            <Box>{children}</Box>
        </Wrapper>
    );
};
