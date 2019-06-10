import { css } from "emotion";
import styled from "react-emotion";

export const EditContainer = styled("div")({
    padding: 40,
    position: "relative"
});

export const RowContainer = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    marginBottom: 25,
    borderRadius: 2,
    backgroundColor: "var(--mdc-theme-surface)",
    border: "1px solid var(--mdc-theme-on-background)",
    boxShadow: "rgba(46,41,51,0.08) 2px 2px 2px, rgba(71,63,79,0.08) 2px 2px 4px"
});

export const Row = styled("div")({
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-surface)",
    paddingLeft: 40,
    position: "relative"
});

export const FieldContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    backgroundColor: "var(--mdc-theme-background)",
    padding: "0 15px",
    margin: 10,
    borderRadius: 2,
    transition: "box-shadow 225ms",
    cursor: "grab",
    "&:hover": {
        boxShadow: "rgba(46,41,51,0.08) 2px 2px 2px, rgba(71,63,79,0.08) 2px 2px 4px"
    }
});

export const rowHandle = css({
    width: 30,
    cursor: "grab",
    position: "absolute",
    left: 5,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1
});

export const fieldHandle = css({
    cursor: "grab"
});
