import styled from "@emotion/styled";
import React from "react";

const Content = styled("h4")({
    color: "#938F99",
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: "0.5px",
    marginBottom: "5px"
});

interface Props {
    name: string;
}
export const ModelName: React.FC<Props> = ({ name }) => {
    return <Content>{name}</Content>;
};
