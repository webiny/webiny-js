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
    marginBottom: 10
});

export const Row = styled("div")({
    display: "flex",
    padding: 5,
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-surface)"
});

export const FieldContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    backgroundColor: "var(--mdc-theme-background)",
    margin: 3
});

export const rowHandle = css({
    width: 30,
    cursor: "grab",
    float: "left",
    marginTop: 26
});

export const fieldHandle = css({
    cursor: "grab",
    padding: 15
});