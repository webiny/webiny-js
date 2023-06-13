import styled from "@emotion/styled";
import React from "react";

const Content = styled("h3")({
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: 24,
    lineHeight: "32px",
    marginBottom: "5px"
});

interface Props {
    title: string;
}
export const Title: React.VFC<Props> = ({ title }) => {
    return <Content>{title}</Content>;
};
