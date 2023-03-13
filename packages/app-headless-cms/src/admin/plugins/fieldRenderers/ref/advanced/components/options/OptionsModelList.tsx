import styled from "@emotion/styled";
import React from "react";
import { CmsModel } from "~/types";
import { OptionsModelListItem } from "./OptionsModelListItem";

const Container = styled("span")({
    display: "flex",
    marginLeft: "5px"
});
const ModelsContainer = styled("div")({
    position: "absolute",
    zIndex: 1,
    top: "35px",
    left: "auto",
    width: "200px",
    backgroundColor: "#FFFFFF",
    border: "1px solid var(--mdc-theme-background)",
    display: "flex",
    flexDirection: "column"
});

const Icon = styled("div")({
    cursor: "default",
    color: "var(--mdc-theme-primary)"
});

interface Props {
    models: CmsModel[];
    onClick: (modelId: string) => void;
}
export const OptionsModelList: React.VFC<Props> = ({ models, onClick }) => {
    if (models.length <= 1) {
        return null;
    }

    return (
        <>
            <Container>
                <Icon>&gt;</Icon>
            </Container>
            <ModelsContainer>
                {models.map(model => {
                    return (
                        <OptionsModelListItem
                            onClick={onClick}
                            key={`model-${model.modelId}`}
                            model={model}
                        />
                    );
                })}
            </ModelsContainer>
        </>
    );
};
