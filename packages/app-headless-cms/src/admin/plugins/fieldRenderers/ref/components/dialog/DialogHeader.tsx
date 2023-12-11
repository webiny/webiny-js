import styled from "@emotion/styled";
import React from "react";
import { CmsModel } from "~/types";
import { ReactComponent as CloseIcon } from "./assets/close.svg";

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

const CloseContainer = styled("div")({
    width: "20px",
    height: "20px",
    paddingTop: "5px"
});

const CloseButton = styled("button")({
    background: "transparent",
    border: "0 none",
    outline: "none",
    cursor: "pointer",
    display: "block",
    width: "100%",
    height: "100%",
    padding: "0",
    margin: "0",
    " > svg": {
        display: "block",
        width: "100%",
        height: "100%"
    }
});

interface CloseProps {
    onClick: () => void;
}

const Close = ({ onClick }: CloseProps) => {
    return (
        <CloseContainer>
            <CloseButton onClick={onClick}>
                <CloseIcon />
            </CloseButton>
        </CloseContainer>
    );
};

interface DialogHeaderProps {
    model: CmsModel;
    onClose: () => void;
}

export const DialogHeader = ({ model, onClose }: DialogHeaderProps) => {
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
