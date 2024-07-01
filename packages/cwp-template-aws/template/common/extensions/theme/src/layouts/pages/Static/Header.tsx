import React from "react";
import { HeaderDesktop } from "./HeaderDesktop";
import { HeaderMobile } from "./HeaderMobile";
import styled from "@emotion/styled";

export const Header = () => {
    return (
        <HeaderWrapper data-testid={"pb-desktop-mobile-headers"}>
            <HeaderDesktop />
            <HeaderMobile />
        </HeaderWrapper>
    );
};

const HeaderWrapper = styled.header`
    background-color: #fff;
    box-shadow: 0 0 1px 1px rgb(34 45 57 / 15%);
    height: 40px;
    padding: 10px 0 5px;
    width: 100%;
    z-index: 100;

    position: sticky;
    top: 0;

    a {
        ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph1")}
        color: ${props => props.theme.styles.colors["color1"]};
        text-decoration: none;
    }
`;
