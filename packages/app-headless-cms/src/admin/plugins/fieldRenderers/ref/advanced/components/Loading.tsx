import React from "react";
import styled from "@emotion/styled";

const Overlay = styled("div")({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
});

const Text = styled("div")({
    width: "100%",
    marginTop: "50%"
});

export const Loading: React.FC = () => {
    return (
        <Overlay>
            <Text>Loading . . .</Text>
        </Overlay>
    );
};
