import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";

const Container = styled("div")({
    color: "--var(mdc-theme-primary)",
    display: "flex",
    flexDirection: "row",
    width: "100%",
    cursor: "pointer",
    ":hover": {
        backgroundColor: "var(--mdc-theme-background)"
    }
});

// const Icon = styled("div")({
//     width: "50px"
// });
const Content = styled("div")({
    display: "flex",
    flexDirection: "column"
});

const Title = styled("h4")({
    padding: "10px 10px 10px 0",
    paddingLeft: "10px"
});
const Description = styled("p")({
    fontSize: 12,
    padding: "0 0px 10px 0",
    paddingLeft: "10px"
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
