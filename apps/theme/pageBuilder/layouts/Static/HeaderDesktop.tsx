import React from "react";
import { Link } from "@webiny/react-router";
import Menu from "./../../components/Menu";
import Navigation from "./Navigation";
import styled from "@emotion/styled";

import { fonts, breakpoints } from "../../theme";
import { usePage } from "@webiny/app-page-builder-elements";

const StyledDesktopHeader = styled.div`
    align-items: center;
    display: flex;
    height: 35px;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;

    ${breakpoints.tablet} {
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
        font-family: ${fonts.font1};
    }
`;

const HeaderDesktop: React.FC = () => {
    const { page } = usePage();
    const { name, logo } = page.settings;

    return (
        <StyledDesktopHeader data-testid={"pb-desktop-header"}>
            <div>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && <span>{name}</span>}
                </Link>
            </div>
            <nav>
                <Menu slug={"main-menu"} component={Navigation} />
            </nav>
        </StyledDesktopHeader>
    );
};

export default HeaderDesktop;
