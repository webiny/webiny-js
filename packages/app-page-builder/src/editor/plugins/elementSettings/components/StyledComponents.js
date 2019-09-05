//@flow
import styled from "@emotion/styled";

export const Footer = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    paddingBottom: 10,
    margin: "0 -15px -15px -15px",
    ".mdc-layout-grid": {
        padding: "15px 10px 10px 15px",
        ".mdc-layout-grid__cell.mdc-layout-grid__cell--span-4": {
            paddingRight: 10
        }
    }
});

export const InputContainer = styled("div")(props => ({
    "> .mdc-text-field.mdc-text-field--upgraded": {
        height: "30px !important",
        width: props.width || 50,
        margin: props.hasOwnProperty("margin") ? props.margin : "0 0 0 18px",
        ".mdc-text-field__input": {
            paddingTop: 5
        }
    }
}));
