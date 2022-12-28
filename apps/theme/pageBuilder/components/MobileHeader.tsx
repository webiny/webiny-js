import React from "react";
import HamburgerMenu from "react-hamburger-menu";
import { useQuery } from "@apollo/react-hooks";
import { Link } from "@webiny/react-router";
import Menu, { GET_PUBLIC_MENU, hasMenuItems } from "./Menu";
import Navigation from "./Navigation";

import styled from "@emotion/styled";
import { ClassNames } from "@emotion/core";

import { colors, fonts, breakpoints } from "../theme";

const StyledMobileHeader = styled.div`
    display: none;

    @keyframes slide-in {
        100% {
            transform: translateX(0%);
        }
    }

    @keyframes slide-out {
        0% {
            transform: translateX(0%);
        }
        100% {
            transform: translateX(200%);
        }
    }

    ${breakpoints.tablet} {
        align-items: center;
        display: flex;
        height: 35px;
        justify-content: space-between;
        margin: 0 auto;
        max-width: 1200px;

        > .logo {
            ${breakpoints.tablet} {
                margin-left: 25px;
                width: 50%;
            }

            img {
                max-height: 30px;
            }
        }

        > nav {
            -moz-osx-font-smoothing: grayscale;
            -webkit-font-smoothing: antialiased;
            animation: slide-out 0.5s forwards;
            animation-timing-function: ease-in-out;
            background: ${colors.color4};
            color: ${colors.color1};
            font-family: ${fonts.font1};
            height: 100%;
            position: fixed;
            right: 0;
            top: 0;
            transform: translateX(200%);
            width: 250px;
            z-index: 11;

            &.active {
                animation: slide-in 0.5s forwards;
                display: block;
            }

            > div {
                position: fixed;
                right: -25px;
                top: 28px;
                width: calc(100% - 25px);
                z-index: 12;

                a {
                    font-size: 1.2rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
            }
        }

        > .hamburger-icon {
            position: fixed;
            right: 25px;
            top: 18px;
            z-index: 12;
        }

        .mobile-overlay {
            background-color: var(--webiny-theme-color-on-background, #131313);
            opacity: 0;
            transition: opacity 0.25s ease-in-out;

            &.active {
                height: 100vh;
                left: 0;
                opacity: 0.5;
                overflow: hidden;
                position: fixed;
                top: 0;
                width: 100vw;
                z-index: 10;
            }
        }
    }
`;

interface MobileHeaderPropsLogo {
    src: string;
}

interface MobileHeaderProps {
    menuName: string;
    logo: MobileHeaderPropsLogo;
    name: string;
    active: boolean;
    toggleMenu: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
    menuName,
    logo,
    name,
    active,
    toggleMenu
}) => {
    const { data } = useQuery(GET_PUBLIC_MENU, { variables: { slug: menuName } });
    return (
        <StyledMobileHeader data-testid={"pb-mobile-header"}>
            <div className={"logo"}>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && <span>{name}</span>}
                </Link>
            </div>
            <nav className={active ? "active" : ""}>
                <Menu slug={menuName} component={Navigation} />
                <div>
                    <a href="/">{name}</a>
                </div>
            </nav>
            {hasMenuItems(data) && (
                <div onClick={toggleMenu} className="hamburger-icon">
                    <HamburgerMenu
                        isOpen={active}
                        menuClicked={toggleMenu}
                        width={18}
                        height={15}
                        strokeWidth={1}
                        rotate={0}
                        color="black"
                        borderRadius={0}
                        animationDuration={0.5}
                    />
                </div>
            )}
            <ClassNames>
                {({ cx }) => (
                    <div onClick={toggleMenu} className={cx("mobile-overlay", { active })} />
                )}
            </ClassNames>
        </StyledMobileHeader>
    );
};

export default MobileHeader;
