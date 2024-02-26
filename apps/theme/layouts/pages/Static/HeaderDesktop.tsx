import React from "react";
import { Link } from "@webiny/react-router";
import styled from "@emotion/styled";
import { usePage } from "@webiny/app-page-builder-elements";
import { Menu } from "@webiny/app-website";
import { Navigation } from "./Navigation";

export const HeaderDesktop = () => {
    const { layoutProps } = usePage();
    const { settings } = layoutProps;
    const { name, logo } = settings;

    return (
        <HeaderDesktopWrapper data-testid={"pb-desktop-header"}>
            <div>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && <span>{name}</span>}
                </Link>
            </div>
            <nav>
                <Menu slug={"main-menu"} component={Navigation} />
            </nav>
        </HeaderDesktopWrapper>
    );
};

const HeaderDesktopWrapper = styled.div`
    align-items: center;
    display: flex;
    height: 35px;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;

    ${props => props.theme.breakpoints["tablet"]} {
        display: none;
    }

    > div {
        img {
            max-height: 30px;
        }
    }

    > nav {
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        flex: 1;
    }
`;
