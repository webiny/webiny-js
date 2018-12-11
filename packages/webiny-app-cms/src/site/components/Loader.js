// @flow
import React from "react";
import styled from "react-emotion";
import { keyframes } from "emotion";
import editorMock from "./loader.png";

const imageAnim = keyframes`
    0% {
        transform: translateY(-300px) scaleY(2.5) scaleX(0.2);
        transform-origin: 50% 0%;
        filter: blur(40px);
        opacity: 0;
        width: 320px;
    }
    30% {
        transform: translateY(0) scaleY(1) scaleX(1);
        transform-origin: 50% 50%;
        filter: blur(0);
        opacity: 1;
        width: 320px;
    }
    80% {
        transform: translateY(0) scaleY(1) scaleX(1);
        transform-origin: 50% 50%;
        filter: blur(0);
        opacity: 1;
        width: 320px;
    }
    100% {
        transform: translateY(300px) scaleY(2.5) scaleX(0.2);
        transform-origin: 50% 0%;
        filter: blur(40px);
        opacity: 0;
    }
`;

const LoadingEditor = styled("div")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "calc(100vh - 200px)",
    flexDirection: "column",
    color: "var(--mdc-theme-on-surface)",
    img: {
        marginBottom: 15,
        animation: imageAnim + " 2s both",
        animationFillMode: "forwards"
    }
});

export default () => {
    return (
        <LoadingEditor>
            <img src={editorMock} />
        </LoadingEditor>
    );
};
