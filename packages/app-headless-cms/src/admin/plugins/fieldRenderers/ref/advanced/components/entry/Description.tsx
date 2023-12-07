import styled from "@emotion/styled";
import React from "react";

const Content = styled("p")({
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: "0.25px",
    boxSizing: "border-box",
    paddingRight: 20,
    paddingBottom: 10
});
interface DescriptionProps {
    description?: string | null;
}

export const Description = ({ description }: DescriptionProps) => {
    const MAX_LENGTH = 320;
    if (!description) {
        return <Content />;
    }

    return (
        <Content>
            {description.length > MAX_LENGTH
                ? description.substring(0, MAX_LENGTH) + "..."
                : description}
        </Content>
    );
};
