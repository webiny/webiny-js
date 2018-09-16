import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import { dispatch } from "webiny-app/redux";
import Slate from "webiny-cms-editor/components/Slate";
import { updateElement } from "webiny-cms-editor/actions";

const onChange = (value, element) => {
    dispatch(updateElement({ element: set(element, "data.text", value) }));
};

const ButtonStyle = styled("button")({
    display: "inline-block",
    background: "#cc1c42",
    color: "#fff",
    border: "none",
    boxSizing: "border-box",
    padding: "0 8px",
    verticalAlign: "middle",
    height: 40,
    marginLeft: 16,
    marginRight: 14,
    cursor: "pointer",
    position: "relative",
    textShadow: "0px 2px 0px rgba(0, 0, 0, 0.2)",
    boxShadow: "0px 2px 2px 1px rgba(0,0,0,0.15)",
    fontFamily: `"Alegreya", "Cambria", "Georgia", "Palatino Linotype", serif`,
    lineHeight: "100%",
    fontSize: 24,
    textAlign: "center",
    textDecoration: "none !important",
    fontStyle: "italic",
    fontWeight: "bold",
    "&::before": {
        display: "block",
        position: "absolute",
        top: 0,
        left: -16,
        content: `" "`,
        width: 16,
        height: 41,
        background: `url("https://admin.webiny.com/uploads/nelchee-gmail-com/company_2/themes/NelaDunato-v2/images/icons.png") -100px -50px no-repeat`
    },
    "&::after": {
        display: "block",
        position: "absolute",
        top: 0,
        right: -14,
        content: `" "`,
        width: 14,
        height: 41,
        background: `url("https://admin.webiny.com/uploads/nelchee-gmail-com/company_2/themes/NelaDunato-v2/images/icons.png") -100px -50px no-repeat`,
        backgroundPosition: "-116px -50px"
    }
});

export const Button = ({ theme, element, preview }) => {
    return (
        <ButtonStyle style={{ ...theme.elements.button, ...element.settings.style }}>
            <Slate
                value={element.data.text}
                onChange={preview ? null : value => onChange(value, element)}
            />
        </ButtonStyle>
    );
};

export const ButtonPreview = () => {
    return <ButtonStyle>Join now</ButtonStyle>;
};