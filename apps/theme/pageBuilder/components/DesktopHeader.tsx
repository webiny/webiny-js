import React from "react";
import { Link } from "@webiny/react-router";
import Menu from "./Menu";
import Navigation from "./Navigation";
import styled from "@emotion/styled";

import { fonts, breakpoints } from "../theme";

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

interface DesktopHeaderProps {
    menuName: string;
    logo: {
        src: string;
    };
    name: string;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({ menuName, logo, name }) => {
    return (
        <StyledDesktopHeader data-testid={"pb-desktop-header"}>
            <div>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && <span>{name}</span>}
                </Link>
            </div>
            <nav>
                <Menu slug={menuName} component={Navigation} />
            </nav>
        </StyledDesktopHeader>
    );
};

export default DesktopHeader;
