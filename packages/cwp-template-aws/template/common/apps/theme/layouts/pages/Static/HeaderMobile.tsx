import React, { useCallback, useState } from "react";
import HamburgerMenu from "react-hamburger-menu";
import { useQuery } from "@apollo/react-hooks";
import { Link } from "@webiny/react-router";
import { usePage } from "@webiny/app-page-builder-elements";
import { Menu, GET_PUBLIC_MENU, hasMenuItems } from "@webiny/app-website";
import { ClassNames } from "@emotion/react";
import styled from "@emotion/styled";
import { Navigation } from "./Navigation";

export const HeaderMobile = () => {
    const { data } = useQuery(GET_PUBLIC_MENU, { variables: { slug: "main-menu" } });
    const [menuOpened, setMenuOpened] = useState(false);

    const toggleMenu = useCallback(() => {
        setMenuOpened(!menuOpened);
    }, [menuOpened]);

    const { layoutProps } = usePage();
    const { name, logo } = layoutProps["settings"];

    return (
        <HeaderMobileWrapper data-testid={"pb-mobile-header"}>
            <div className={"logo"}>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && <span>{name}</span>}
                </Link>
            </div>
            <nav className={menuOpened ? "active" : ""}>
                <Menu slug={"main-menu"} component={Navigation} />
                <div>
                    <a href="/">{name}</a>
                </div>
            </nav>
            {hasMenuItems(data) && (
                <div onClick={toggleMenu} className="hamburger-icon">
                    <HamburgerMenu
                        isOpen={menuOpened}
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
                    <div
                        onClick={toggleMenu}
                        className={cx("mobile-overlay", { active: menuOpened })}
                    />
                )}
            </ClassNames>
        </HeaderMobileWrapper>
    );
};

const HeaderMobileWrapper = styled.div`
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

    ${props => props.theme.breakpoints["tablet"]} {
        align-items: center;
        display: flex;
        height: 35px;
        justify-content: space-between;
        margin: 0 auto;
        max-width: 1200px;

        > .logo {
            ${props => props.theme.breakpoints["tablet"]} {
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
            background: ${props => props.theme.styles.colors["color5"]};
            color: ${props => props.theme.styles.colors["color1"]};
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
