import styled from "@emotion/styled";
import { css } from "emotion";

export const Item = styled("div")(({ isActive, isSelected }) => ({
    cursor: "pointer",
    display: "block",
    border: "none",
    height: "auto",
    textAlign: "left",
    borderTop: "none",
    lineHeight: "1em",
    color: "var(--mdc-theme-text-primary-on-background)",
    fontSize: "1rem",
    textTransform: "none",
    boxShadow: "none",
    padding: ".8rem 1.1rem",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    wordWrap: "normal",
    backgroundColor: isActive ? "var(--mdc-theme-on-background)" : "var(--mdc-theme-surface)",
    fontWeight: isSelected ? "bold" : "normal",
    "&:hover, &:focus": {
        borderColor: "#96c8da",
        boxShadow: "0 2px 3px 0 rgba(34,36,38,.15)"
    }
}));

export const List = styled("div")({
    border: "var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-surface)",
    position: "relative",
    left: 0,
    top: 0,
    height: "200px",
    width: "100%",
    overflow: "scroll"
});

export const dropDownDialog = css({
    position: "absolute",
    zIndex: "2",
    top: 27,
    left: -5,
    width: 200
});

export const Button = styled("div")({
    padding: "1px 3px 3px 3px",
    backgroundColor: "var(--mdc-theme-on-background)",
    fontSize: "0.8em",
    whiteSpace: "nowrap",
    lineHeight: "110%"
});