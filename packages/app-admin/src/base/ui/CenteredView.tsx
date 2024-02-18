import React from "react";
import styled from "@emotion/styled";
import { makeDecoratable } from "~/index";

export interface CenteredViewProps {
    children: React.ReactNode;
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

export const CenteredView = makeDecoratable(
    "CenteredView",
    ({ maxWidth = 700, children }: CenteredViewProps) => {
        return (
            <Container>
                <Width maxWidth={maxWidth}>{children}</Width>
            </Container>
        );
    }
);
