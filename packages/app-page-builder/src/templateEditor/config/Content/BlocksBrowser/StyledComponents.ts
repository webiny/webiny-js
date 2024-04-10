import styled from "@emotion/styled";
import { css } from "emotion";

export const List = styled("div")({
    position: "fixed",
    top: 64,
    left: 0,
    width: "100%",
    height: "100%",
    //overflow: "scroll",
    backgroundColor: "#fff",
    zIndex: 10000
});

export const Input = styled("div")({
    backgroundColor: "var(--mdc-theme-on-background)",
    position: "relative",
    height: 30,
    padding: 3,
    width: "100%",
    borderRadius: 2,
    "> input": {
        border: "none",
        fontSize: 16,
        width: "calc(100% - 10px)",
        height: "100%",
        marginLeft: 50,
        backgroundColor: "transparent",
        outline: "none",
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

export const searchIcon = css({
    "&.mdc-button__icon": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        position: "absolute",
        width: 24,
        height: 24,
        left: 15,
        top: 7
    }
});

export const wrapper = css({
    height: "100vh",
    //overflow: "scroll",
    backgroundColor: "var(--mdc-theme-background)"
});

export const BlockList = styled("div")({
    display: "flex",
    padding: 50,
    justifyContent: "space-around",
    maxWidth: 1200,
    margin: "0 auto",
    flexWrap: "wrap",
    color: "var(--mdc-theme-text-secondary-on-background)"
});

export const BlockPreview = styled("div")({
    pointerEvents: "none",
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#fff"
});

export const blockStyle = css({
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-surface)",
    padding: "15px 15px 35px 15px",
    marginBottom: 25
});

export const Backdrop = styled("div")({
    display: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    opacity: 0.5
});

export const AddBlock = styled("div")({
    display: "none",
    width: 300,
    margin: 5,
    textAlign: "center"
});

export const DeleteBlock = styled("div")({
    margin: 5,
    textAlign: "center",
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 100,
    cursor: "pointer",
    "& svg": {
        color: "var(--mdc-theme-surface)"
    }
});

export const EditBlock = styled("div")({
    margin: 5,
    textAlign: "center",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 100,
    cursor: "pointer",
    "& svg": {
        color: "var(--mdc-theme-surface)"
    }
});

export const Overlay = styled("div")({
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0,
    transform: "scale(0.9)",
    transition: "opacity 0.2s, transform 0.1s",
    "&:hover": {
        opacity: 1,
        transform: "scale(1)",
        "> .backdrop, > .add-block": {
            display: "block"
        }
    }
});

export const Title = styled("div")({
    position: "absolute",
    left: 15,
    bottom: 0
});
