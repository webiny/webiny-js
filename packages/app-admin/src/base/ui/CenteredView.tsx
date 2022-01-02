import React from "react";
import styled from "@emotion/styled";
import { makeComposable } from "~/index";

export interface CenteredViewProps {
    maxWidth?: number | string;
}

const Container = styled.div({
    display: "flex",
    justifyContent: "center"
});

interface Props {
    maxWidth: string | number;
}

const Width = styled.div((props: Props) => ({
    maxWidth: props.maxWidth,
    width: "100%"
}));

export const CenteredView = makeComposable<CenteredViewProps>(
    "CenteredView",
    ({ maxWidth = 700, children }) => {
        return (
            <Container>
                <Width maxWidth={maxWidth}>{children}</Width>
            </Container>
        );
    }
);
