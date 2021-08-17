import React from "react";
import { Link } from "@webiny/react-router";
import Menu from "../Menu";
import NavigationDesktop from "./NavigationDesktop";

type DesktopHeaderProps = {
    menuName: string;
    logo: {
        src: string;
    };
    name: string;
};

const DesktopHeader = ({ menuName, logo, name }: DesktopHeaderProps) => {
    return (
        <div
            className="webiny-pb-section-header__wrapper hide-on-mobile"
            data-testid={"pb-desktop-header"}
        >
            <div className={"webiny-pb-section-header__logo"}>
                <Link to="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && (
                        <span className={"webiny-pb-section-header__site-name"}>{name}</span>
                    )}
                </Link>
            </div>
            <Menu slug={menuName} component={NavigationDesktop} />
        </div>
    );
};

export default DesktopHeader;
