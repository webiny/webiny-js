import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";

const Title = styled("div")({
    width: "100%",
    boxSizing: "border-box",
    paddingTop: 5,
    "&.hasDescription": {
        paddingTop: 0
    }
});

const Content = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: "100%"
});

const Container = styled("div")({
    color: "--var(mdc-theme-primary)",
    display: "flex",
    flexDirection: "row",
    width: "100%",
    cursor: "pointer",
    padding: 15,
    boxSizing: "border-box",
    borderBottom: "1px solid var(--mdc-theme-background)",
    ":hover": {
        backgroundColor: "var(--mdc-theme-background)"
    },
    "&:last-of-type": {
        borderBottom: "none"
    }
});

const Description = styled("p")({
    fontSize: 12,
    marginTop: 10,
    lineHeight: "125%",
    color: "#666"
});

const Icon = styled("div")({
    width: "24px",
    height: "24px",
    marginRight: "15px",
    flex: "0 0 24px"
});

interface OptionsModelListItemProps {
    model: Pick<CmsModel, "modelId" | "name" | "description" | "icon">;
    onClick: (modelId: string) => void;
}

export const OptionsModelListItem = ({
    model,
    onClick: originalOnClick
}: OptionsModelListItemProps) => {
    const onClick = useCallback(() => {
        originalOnClick(model.modelId);
    }, [originalOnClick]);
    return (
        <Container onClick={onClick}>
            <Icon>
                <IconPicker.Icon icon={model.icon} />
            </Icon>
            <Content>
                <Title className={model.description && "hasDescription"}>{model.name}</Title>
                {model.description && <Description>{model.description}</Description>}
            </Content>
        </Container>
    );
};
