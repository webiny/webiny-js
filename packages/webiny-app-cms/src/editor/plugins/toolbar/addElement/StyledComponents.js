//@flow
import styled from "react-emotion";

export const Flex = styled("div")({
    display: "flex",
    height: "100vh"
});

export const Elements = styled("div")({
    flex: "65%",
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "scroll"
});

export const ElementPreview = styled("div")({
    position: "relative",
    padding: 10
});

export const ElementTitle = styled("div")({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-on-surface)"
});

export const ElementBox = styled("div")({
    padding: "0px 15px"
});

export const ElementPreviewCanvas = styled("div")({
    marginTop: 10,
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-surface)",
    color: "var(--mdc-theme-on-surface)",
    padding: 15,
    boxSizing: "border-box",
    width: 260
});

export const Backdrop = styled("div")({
    display: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "var(--mdc-theme-surface)",
    opacity: 0.5
});

export const AddBlock = styled("div")({
    display: "none",
    width: 300,
    margin: 5,
    textAlign: "center"
    //marginTop: 45
});

export const Overlay = styled("div")({
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: 42,
    left: 0,
    width: "100%",
    height: "calc(100% - 42px)",
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
