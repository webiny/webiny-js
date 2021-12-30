import React from "react";
import styled from "@emotion/styled";
import { makeComposable } from "~/index";

export interface CenteredViewProps {
    maxWidth: number | string;
}

export const CenteredView = makeComposable<CenteredViewProps>(
    "CenteredView",
    ({ maxWidth = 700, children }) => {
        const Container = styled.div({
            display: "flex",
            justifyContent: "center"
        });

        const Width = styled.div({
            maxWidth,
            width: "100%"
        });

        return (
            <Container>
                <Width>{children}</Width>
            </Container>
        );
    }
);
