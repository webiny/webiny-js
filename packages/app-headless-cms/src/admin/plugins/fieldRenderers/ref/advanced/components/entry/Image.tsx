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
}
export const Image: React.FC<Props> = ({ title, src }) => {
    if (!src) {
        return <div>default</div>;
    }
    return (
        <Container>
            <img src={src} alt={title} />
        </Container>
    );
};
