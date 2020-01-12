//@flow
import styled from "@emotion/styled";
import { keyframes } from "emotion";

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

export const LoadingEditor = styled("div")({
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

const headerAnim = keyframes`
    0% {
      opacity: .2;
    }
    100% {
      opacity: 1;
    }
`;

const dotsAnim = keyframes`
    0% {
      opacity: .2;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: .2;
    }
`;

export const LoadingTitle = styled("h5")({
    animation: headerAnim + " 0.8s both",
    animationFillMode: "forwards",
    span: {
        animation: dotsAnim + " 1.4s infinite",
        animationFillMode: "both",
        "&:nth-child(2)": {
            animationDelay: ".2s"
        },
        "&:nth-child(3)": {
            animationDelay: ".4s"
        }
    }
});
