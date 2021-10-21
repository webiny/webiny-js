import React from "react";
import HamburgerMenu from "react-hamburger-menu";
import classNames from "classnames";
import { Link } from "@webiny/react-router";

import Menu, { GET_PUBLIC_MENU, hasMenuItems } from "../Menu";
import NavigationMobile from "./NavigationMobile";
import { useHeader } from "./useMobileHeader";
import { NavBar } from "./styled";
import { useQuery } from "@apollo/react-hooks";

const MobileHeader = ({ menuName, logo, name }) => {
    const { mobileMenu, toggleMobileMenu } = useHeader();
    const { data } = useQuery(GET_PUBLIC_MENU, { variables: { slug: menuName } });

    return (
        <NavBar
            data-testid={"pb-mobile-header"}
            className={classNames("hide-on-desktop-and-tablet", {
                "mobile-opened": mobileMenu,
                "mobile-closed": !mobileMenu
            })}
        >
            <div className={"webiny-pb-section-header__logo"}>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && (
                        <span className={"webiny-pb-section-header__site-name"}>{name}</span>
                    )}
                </Link>
            </div>
            <Menu slug={menuName} component={NavigationMobile} />
            {hasMenuItems(data) && (
                <div onClick={toggleMobileMenu} className="webiny-pb-section-header__mobile-icon">
                    <HamburgerMenu
                        isOpen={mobileMenu}
                        menuClicked={toggleMobileMenu}
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
        </NavBar>
    );
};

export default MobileHeader;
