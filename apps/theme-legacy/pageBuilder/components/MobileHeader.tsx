import React from "react";
import HamburgerMenu from "react-hamburger-menu";
import classNames from "classnames";
import { useQuery } from "@apollo/react-hooks";
import { Link } from "@webiny/react-router";
import Menu, { GET_PUBLIC_MENU, hasMenuItems } from "./Menu";
import Navigation from "./Navigation";

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
        <div
            className="webiny-pb-section-header__wrapper hide-on-desktop-and-tablet"
            data-testid={"pb-mobile-header"}
        >
            <div className={"webiny-pb-section-header__logo"}>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && (
                        <span className={"webiny-pb-section-header__site-name"}>{name}</span>
                    )}
                </Link>
            </div>
            <nav
                className={classNames("webiny-pb-section-header__navigation", {
                    "webiny-pb-section-header__navigation--mobile-active": active
                })}
            >
                <Menu slug={menuName} component={Navigation} />
                <div className={"webiny-pb-section-header__mobile-site-name"}>
                    <a href="/">{name}</a>
                </div>
            </nav>
            {hasMenuItems(data) && (
                <div onClick={toggleMenu} className="webiny-pb-section-header__mobile-icon">
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
            <div
                onClick={toggleMenu}
                className={classNames("webiny-pb-section-header__mobile-overlay", {
                    "webiny-pb-section-header__mobile-overlay--active": active
                })}
            />
        </div>
    );
};

export default MobileHeader;
