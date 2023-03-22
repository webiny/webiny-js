import styled from "@emotion/styled";
import React from "react";
import { CmsModel } from "~/types";
import { Elevation } from "@webiny/ui/Elevation";
import { OptionsModelListItem } from "./OptionsModelListItem";
import { ReactComponent as DownIcon } from "../assets/down-arrow.svg";

const Container = styled("span")({
    display: "flex",
    marginLeft: "5px",
    width: 32,
    ">svg": {
        color: "var(--mdc-theme-primary)",
        width: "24px",
        height: "24px"
    }
});
const ModelsContainer = styled(Elevation)({
    position: "absolute",
    zIndex: 1,
    top: "40px",
    left: "auto",
    width: "200px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column"
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
                <DownIcon />
            </Container>
            <ModelsContainer z={1}>
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
