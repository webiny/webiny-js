import styled from "@emotion/styled";
import React from "react";
import { CmsModel } from "~/types";

const Container = styled("div")({
    width: "100%",
    boxSizing: "border-box",
    padding: "20px",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-secondary)",
    color: "#FFF"
});

const Content = styled("div")({
    display: "flex",
    flex: "1",
    flexDirection: "column"
});

const Title = styled("h2")({
    display: "block",
    fontSize: "24px",
    lineHeight: "34px"
});

const Model = styled("h3")({
    display: "block",
    fontSize: "14px",
    fontWeight: "normal",
    " > strong": {
        fontWeight: "bold"
    }
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
    onClose: () => void;
}
export const DialogHeader: React.FC<Props> = ({ model, onClose }) => {
    return (
        <Container>
            <Content>
                <Title>Select an existing record</Title>
                <Model>
                    Content model: <strong>{model.name}</strong>
                </Model>
            </Content>
            <Close onClick={onClose} />
        </Container>
    );
};
