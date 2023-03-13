import styled from "@emotion/styled";
import React from "react";

const Container = styled("div")({
    maxWidth: "166px",
    maxHeight: "166px",
    " > img": {
        display: "block",
        maxWidth: "100%",
        maxHeight: "100%"
    }
});

interface Props {
    title: string;
    src?: string | null;
    width?: number;
}
export const Image: React.VFC<Props> = ({ title, src, width = 166 }) => {
    if (!src) {
        return <Container />;
    }
    return (
        <Container>
            <img src={`${src}?width=${width}`} alt={title} />
        </Container>
    );
};
