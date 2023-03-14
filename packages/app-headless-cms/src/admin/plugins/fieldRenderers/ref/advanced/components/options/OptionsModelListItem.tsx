import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";

const Title = styled("div")({
    width: '100%',
    boxSizing: 'border-box',
});

const Content = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: '100%',
});

const Container = styled("div")({
    color: "--var(mdc-theme-primary)",
    display: "flex",
    flexDirection: "row",
    width: "100%",
    cursor: "pointer",
    padding: 15,
    boxSizing:"border-box",
    borderBottom: '1px solid var(--mdc-theme-background)',
    ":hover": {
        backgroundColor: "var(--mdc-theme-background)"
    },
    '&:last-of-type':{
        borderBottom: 'none'
    }
});

const Description = styled("p")({
    fontSize: 12,
    marginTop: 10,
    lineHeight: '125%',
    color: '#666'
});

interface Props {
    model: CmsModel;
    onClick: (modelId: string) => void;
}
export const OptionsModelListItem: React.VFC<Props> = ({ model, onClick: originalOnClick }) => {
    const onClick = useCallback(() => {
        originalOnClick(model.modelId);
    }, [originalOnClick]);
    return (
        <Container onClick={onClick}>
            {/*<Icon>i</Icon>*/}
            <Content>
                <Title>{model.name}</Title>
                {model.description && <Description>{model.description}</Description>}
            </Content>
        </Container>
    );
};
