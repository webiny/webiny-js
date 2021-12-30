import React, { FC } from "react";
import styled from "@emotion/styled";
import { makeComposable } from "~/index";

export const CenteredView: FC = makeComposable("CenteredView", ({ children }) => {
    const Container = styled.div({
        display: "flex",
        justifyContent: "center"
    });

    const Width = styled.div({
        maxWidth: 700,
        width: "100%"
    });

    return (
        <Container>
            <Width>{children}</Width>
        </Container>
    );
});
