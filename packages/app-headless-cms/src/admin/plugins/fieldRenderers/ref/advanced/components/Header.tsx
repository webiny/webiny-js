import styled from "@emotion/styled";
import React from "react";
import { CmsModel } from "~/types";

const Container = styled("div")({
    width: "100%",
    padding: "20px",
    display: "flex",
    flexDirection: "row"
});

const Content = styled("div")({
    display: "flex",
    flex: "1",
    flexDirection: "column"
});

const Title = styled("div")({
    display: "block"
});

const Model = styled("div")({
    display: "block"
});

const CloseContainer = styled("div")({});

const CloseButton = styled("button")({});
interface CloseProps {
    onClick: () => void;
}
const Close: React.FC<CloseProps> = ({ onClick }) => {
    return (
        <CloseContainer>
            <CloseButton onClick={onClick}>x</CloseButton>
        </CloseContainer>
    );
};

interface Props {
    model: CmsModel;

    onCloseClick: () => void;
}
export const Header: React.FC<Props> = ({ model, onCloseClick }) => {
    return (
        <Container>
            <Content>
                <Title>Select an existing record</Title>
                <Model>
                    Content model: <strong>{model.name}</strong>
                </Model>
            </Content>
            <Close onClick={onCloseClick} />
        </Container>
    );
};
