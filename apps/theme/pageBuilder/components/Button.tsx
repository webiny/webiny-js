import React from "react";
import { cx, css } from "emotion";
import { Link } from "@webiny/react-router";
import { ReactComponent as ArrowRightIcon } from "./assets/btn-arrow-right.svg";

const buttonDefault = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
    marginLeft: 0,
    padding: "14px 20px",
    verticalAlign: "top",
    textAlign: "center",
    fontFamily: "Source Sans Pro",
    fontSize: 14,
    lineHeight: 1,
    borderRadius: 4,
    willChange: "opacity",
    transition: "all 0.2s",
    cursor: "pointer",
    color: "#333",
    backgroundColor: "#fff",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: ".025em",
    fontWeight: 600,
    boxSizing: "border-box",
    outline: "none",
    border: "none",
    "&:hover": {
        boxShadow: "0 7px 14px rgba(50,50,93,.1), 0 3px 6px rgba(0,0,0,.08)",
        transform: "translateY(-1px)"
    },
    "&:active": {
        transform: "translateY(1px)"
    },
    "img.arrow": {
        marginLeft: 10
    },
    width: "inherit",

    ".webiny-pb-editor-device--mobile-landscape &, .webiny-pb-editor-device--mobile-portrait &": {
        width: "100%"
    }
});

const buttonFullWidthStyle = css({
    width: "100% !important"
});

const buttonPrimary = css({
    backgroundColor: "var(--webiny-theme-color-primary)",
    color: "var(--webiny-theme-color-surface)",
    textTransform: "uppercase",
    //fontSize: 20,
    //border: '1px solid #ED4005',
    //boxShadow: '0 2px 3px 0 rgba(160,160,160,0.50)',
    "&:hover, &:active": {
        background: "#ED4005"
        //boxShadow: '0px 0px 0px 3px #FA5723',
        //borderColor: '#ED4005',
    }
});

const buttonSecondary = css({
    backgroundColor: "var(--webiny-theme-color-secondary)",
    color: "var(--webiny-theme-color-surface)",
    textTransform: "uppercase",
    //fontSize: 20,
    //border: '1px solid #3FBFB0',
    "&:hover, &:active": {
        background: "#3FBFB0"
        //boxShadow: '0px 0px 0px 3px #3FBFB0',
        //borderColor: '#3FBFB0',
    }
});

const buttonDark = css({
    backgroundColor: "var(--webiny-theme-color-dark)",
    color: "var(--webiny-theme-color-surface)",
    textTransform: "uppercase"
});

const buttonDefaultDark = css({
    backgroundColor: "transparent",
    color: "var(--webiny-theme-color-on-surface)",
    textTransform: "uppercase",
    padding: 0,
    "&:hover": {
        boxShadow: "none",
        textDecoration: "underline"
    }
});

const buttonPrimaryLink = css({
    backgroundColor: "transparent",
    color: "var(--webiny-theme-color-primary)",
    textTransform: "uppercase",
    padding: 0,
    "&:hover": {
        boxShadow: "none",
        textDecoration: "underline"
    }
});

const buttonOutline = css({
    backgroundColor: "transparent",
    color: "var(--webiny-theme-color-surface)",
    textTransform: "uppercase",
    border: "solid 2px #fff",
    padding: "12px 20px"
});

const buttonOutlineDark = css({
    backgroundColor: "transparent",
    color: "var(--webiny-theme-color-on-surface)",
    textTransform: "uppercase",
    border: "solid 2px " + "var(--webiny-theme-color-on-surface)",
    padding: "12px 20px"
});

interface ButtonProps {
    type?: string;
    className?: string;
    link?: string;
    onClick?: () => void;
    arrow?: boolean;
    target?: string;
    fullWidth?: boolean;
}

const Button: React.FunctionComponent<ButtonProps> = props => {
    const styles = {
        defaultDark: buttonDefaultDark,
        fullWidth: buttonFullWidthStyle,
        primary: buttonPrimary,
        secondary: buttonSecondary,
        default: buttonDefault,
        dark: buttonDark,
        outline: buttonOutline,
        outlineDark: buttonOutlineDark,
        primaryLink: buttonPrimaryLink
    };

    let style = "default";

    if (props.hasOwnProperty("type")) {
        style = props.type;
    }
    style = cx(styles["default"], styles[style]);

    if (props.hasOwnProperty("className")) {
        style += " " + props.className;
    }

    if (props.hasOwnProperty("fullWidth")) {
        style += " " + styles.fullWidth;
    }

    if (props.hasOwnProperty("link")) {
        if (
            props.link.startsWith("http") ||
            props.link.startsWith("mailto:") ||
            props.link.startsWith("/docs/")
        ) {
            return (
                <a
                    href={props.link}
                    className={style}
                    target={props.hasOwnProperty("target") ? props.target : "_self"}
                >
                    {props.children}
                    {props.arrow && <ArrowRightIcon className={"arrow"} />}
                </a>
            );
        } else {
            return (
                <Link to={props.link} className={style}>
                    {props.children}
                    {props.arrow && <ArrowRightIcon className={"arrow"} />}
                </Link>
            );
        }
    }

    return (
        <button className={style} onClick={props.onClick}>
            {props.children}
            {props.arrow && <ArrowRightIcon className={"arrow"} />}
        </button>
    );
};

export default Button;
