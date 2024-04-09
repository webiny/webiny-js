import styled from "@emotion/styled";
import React from "react";

const Content = styled("h3")({
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: 24,
    lineHeight: "32px",
    marginBottom: "5px"
});

interface TitleProps {
    title: string;
}
export const Title = ({ title }: TitleProps) => {
    return <Content>{title}</Content>;
};
