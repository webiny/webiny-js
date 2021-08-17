// https://emotion.sh/docs/babel-macros
import styled from "@emotion/styled/macro";
import { css } from "emotion";
import rightArrow from "./assets/arrow-right.svg";

const theme = {
    color: {
        black: "#333",
        lightGray: "var(--webiny-theme-color-background)"
    }
};

const DROPDOWN_LINK_HEIGHT = 18;

export const Logo = styled.div``;

export const Menu = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & ul {
        display: flex;
        list-style: none;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }

    & .menu--left {
    }

    & .menu--right {
        margin-top: -5px;

        & li:last-child {
            margin-left: 16px;
        }
    }

    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        display: none;

        & ul {
            display: none;
        }
    }
`;

export const DropDown = styled.div`
    position: absolute;
    display: flex;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    width: 785px;
    left: -40px;
    padding: 30px;
    top: 56px;
    height: 226px;
    background-color: #fff;
    flex-direction: row;
    text-align: left;
    border-radius: 4px;
    visibility: hidden;
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(2em) translateX(0%);
    z-index: -1;
    transition: all 0.1s ease-in-out 0s, visibility 0s linear 0.1s, z-index 0s linear 0.01s;

    & .section--primary {
        box-sizing: border-box;
        width: 45%;
        height: 100%;
        padding: 0 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex-wrap: wrap;

        & .link {
            margin-bottom: 8px;
            position: relative;
            color: #000e1a;
            font-size: 0.875rem;
            font-weight: 500;
            line-height: 1.25rem;
            transition: 150ms color ease-in;

            &::after {
                content: url(${rightArrow});
                position: absolute;
                right: -20px;
                opacity: 0;
                transition: opacity 150ms ease-in, transform 200ms linear 150ms;
            }

            &:hover {
                color: #7b39d9;

                &::after {
                    opacity: 1;
                    transform: translateX(5px);
                }
            }
        }

        & .spacer {
            height: ${DROPDOWN_LINK_HEIGHT}px;
        }

        &.has-border {
            border-left: 1px solid #e3e3e3;
            padding-left: 26px;
        }
    }

    & .section--secondary {
        display: flex;
        box-sizing: border-box;
        width: 55%;
        height: 100%;
        flex-direction: row;
        justify-content: space-between;
        border-left: 1px solid #e3e3e3;
        padding-left: 26px;
    }

    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        position: relative;
        display: none;
        box-shadow: none;
        width: 100%;
        left: 0;
        padding: 0 25px 10px 25px;
        top: 25px;
        flex-direction: column;

        & .section--primary {
            &.has-border {
                border-left: none;
                padding-left: 0;
            }
        }

        & .section--secondary {
            display: none;
        }
    }

    .open {
        display: block;
    }

    &.one-row {
        // desktop
        width: 380px;

        .webiny-pb-media-query--mobile-landscape &,
        .webiny-pb-media-query--mobile-portrait & {
            width: 100%;
        }
    }

    &.two-rows {
        // desktop
        width: 600px;

        .webiny-pb-media-query--mobile-landscape &,
        .webiny-pb-media-query--mobile-portrait & {
            width: 100%;
        }
    }

    &.three-rows-large {
        width: 900px;
    }
`;

export const MobileMenu = styled("div")({
    paddingRight: 20,
    display: "none",
    position: "relative",
    height: "calc(100vh - 80px)",
    overflowX: "scroll",
    width: "auto",
    margin: 15,
    listStyle: "none",
    boxSizing: "border-box",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 5,

    "& ul": {
        listStyle: "none"
    },
    // @ts-ignore
    [DropDown]: {
        transform: "translateY(0) translateX(0)",
        height: "auto",
        position: "relative",
        top: 0,
        "& .section--primary": {
            width: "100%",
            padding: 0
        }
    }
});

export const NavBar = styled("div")({
    margin: "0 auto",
    display: "flex",
    alignContent: "flex-end",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 0,
    paddingTop: 0,
    // @ts-ignore
    [MobileMenu]: {
        display: "none"
    },
    "&.mobile-opened": {
        backgroundColor: "inherit",
        height: "inherit",
        justifyContent: "space-between",
        // @ts-ignore
        [MobileMenu]: {
            display: "none"
        }
    },

    // Responsive style
    ".webiny-pb-media-query--mobile-landscape &, .webiny-pb-media-query--mobile-portrait &": {
        flexDirection: "column",
        marginTop: -10,
        paddingTop: 10,
        "&.mobile-opened": {
            backgroundColor: "var(--webiny-theme-color-background)",
            height: "100vh",
            justifyContent: "flex-start",
            // @ts-ignore
            [MobileMenu]: {
                display: "block"
            }
        }
    }
});

export const MenuItem = styled("li")({
    // Layout
    margin: "0px 0 0 30px",
    padding: "15px 25px 15px 0",
    borderBottom: "none",

    // Text
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    fontSize: 14,
    fontWeight: 700,
    color: "#000e1a",
    "& .root-link": {
        color: "inherit",
        textDecoration: "none"
    },
    "&:hover": { color: "#707070" },
    "&:hover .arrow-icon path": { fill: "#707070" },
    transition: "150ms color",

    // Make `Dropdown` visible
    "&:hover, &:focus": {
        // @ts-ignore
        [DropDown]: {
            visibility: "visible",
            display: "flex",
            opacity: 1,
            zIndex: 1,
            transform: "translateY(1em) translateX(0%)",
            transitionDelay: "0s, 0s, 0.1s"
        }
    },

    // Responsive style
    ".webiny-pb-media-query--mobile-landscape &, .webiny-pb-media-query--mobile-portrait &": {
        margin: "0 0 15px 0",
        paddingTop: 0,
        borderBottom: `1px solid ${theme.color.lightGray}`
    }
});

export const downArrowClass = css`
    position: absolute;
    top: calc((45px - 24px) / 2);
    right: 0;
    width: 24px;
    height: 24px;

    & path {
        fill: #000e1a;
    }

    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        top: -1px;
    }
`;

export const dropdownArrow = css`
    position: absolute;
    background: #fff;
    border: 4px solid #fff;
    top: 0;
    left: 5%;
    z-index: -1;

    &:after,
    &:before {
        bottom: 100%;
        left: 50%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }

    &:after {
        border-color: rgba(136, 183, 213, 0);
        border-bottom-color: #fff;
        border-width: 5px;
        margin-left: -5px;
    }

    &:before {
        border-color: rgba(194, 225, 245, 0);
        border-bottom-color: #fff;
        border-width: 11px;
        margin-left: -11px;
        left: 25px;
    }
`;

export const Card = styled.div`
    display: flex;
    flex-direction: column;
    width: 175px;
    height: 152px;
    background-color: white;

    & .card__img {
        width: 100%;
    }

    & .card__title {
        color: #000e1a;
        font-size: 0.875rem;
        font-weight: 700;
        margin: 10px 0;
        text-transform: capitalize;
    }

    & .card__link {
        color: #7b39d9;
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        margin: 0;

        & .icon {
            width: 18px;
            margin-left: 6px;
            transition: transform 150ms ease-in;
        }
    }

    &:hover {
        & .card__link .icon {
            transform: translateX(6px);
        }
    }
`;

export const githubMenu = css`
    padding-top: 10px;

    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        padding-top: 5px;
    }
`;

export const buttonOutlinePrimary = css`
    background-color: #fff !important;
    color: #fa5a28 !important;
    border: solid 2px #fa5a28 !important;
    padding: 12px 20px !important;
`;
