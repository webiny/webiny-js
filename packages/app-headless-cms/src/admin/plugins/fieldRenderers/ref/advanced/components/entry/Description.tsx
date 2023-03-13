import styled from "@emotion/styled";
import React from "react";

const Content = styled("p")({
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: "0.25px",
    padding: "0 10px 0 0"
});
interface Props {
    description?: string | null;
}
export const Description: React.VFC<Props> = ({ description }) => {
    return <Content>{description}</Content>;
};
