import { css } from "emotion";
import styled from "@emotion/styled";

export const RowContainer = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    marginBottom: 25,
    borderRadius: 2,
    padding: "0 !important",
    height: "auto !important",
    backgroundColor: "var(--mdc-theme-surface)",
    border: "1px solid var(--mdc-theme-on-background)",
    boxShadow:
        "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
});

export const Row = styled("div")({
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-surface)",
    paddingLeft: 40,
    paddingRight: 0,
    position: "relative"
});

export const fieldContainer = css({
    display: "flex",
    alignItems: "center",
    position: "relative",
    flex: "1 100%",
    backgroundColor: "var(--mdc-theme-background)",
    padding: "0 15px",
    margin: 10,
    borderRadius: 2,
    border: "1px solid var(--mdc-theme-on-background)",
    transition: "box-shadow 225ms",
    color: "var(--mdc-theme-on-surface)",
    "&:hover": {
        boxShadow:
            "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
    }
});

export const rowHandle = css({
    width: 30,
    cursor: "grab",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    color: "var(--mdc-theme-on-surface)"
});
