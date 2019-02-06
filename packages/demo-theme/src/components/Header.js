//@flow
import * as React from "react";
import { Menu } from "webiny-app-cms/render/components";
import HamburgerMenu from "react-hamburger-menu";
import classNames from "classnames";
import { get } from "lodash";
import { Query } from "react-apollo";
import { getHeaderData } from "./graphql";
import DefaultMenu from "./DefaultMenu";

type State = {
    mobileMenuOpen: boolean
};
const menuName = "demo-menu";

class Header extends React.Component<{}, State> {
    state = { mobileMenuOpen: false };

    toggleMobileMenu = () => {
        this.setState({
            mobileMenuOpen: !this.state.mobileMenuOpen
        });
    };

    render() {
        return (
            <Query query={getHeaderData}>
                {({ data: response }) => {
                    const { name, logo } = get(response, "settings.cms") || {};

                    return (
                        <React.Fragment>
                            <div className={"webiny-cms-section-header"}>
                                <DesktopHeader name={name} logo={logo} />
                                <MobileHeader
                                    name={name}
                                    logo={logo}
                                    active={this.state.mobileMenuOpen}
                                    toggleMenu={this.toggleMobileMenu}
                                />
                            </div>
                            <div className={"webiny-cms-section-header-spacer"} />
                        </React.Fragment>
                    );
                }}
            </Query>
        );
    }
}

const DesktopHeader = ({ logo, name }: { logo: Object, name: string }) => {
    return (
        <div className="webiny-cms-section-header__wrapper hide-on-mobile">
            <div className={"webiny-cms-section-header__logo"}>
                <a href="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && (
                        <span className={"webiny-cms-section-header__site-name"}>{name}</span>
                    )}
                </a>
            </div>
            <nav className={"webiny-cms-section-header__navigation"}>
                <Menu slug={menuName} component={DefaultMenu} />
            </nav>
        </div>
    );
};

const MobileHeader = ({
    logo,
    name,
    active,
    toggleMenu
}: {
    logo: Object,
    name: string,
    active: boolean,
    toggleMenu: Function
}) => {
    return (
        <div className="webiny-cms-section-header__wrapper hide-on-desktop-and-tablet">
            <div className={"webiny-cms-section-header__logo"}>
                <a href="/">
                    {logo && logo.src && <img src={logo.src} alt={name} />}{" "}
                    {(!logo || !logo.src) && (
                        <span className={"webiny-cms-section-header__site-name"}>{name}</span>
                    )}
                </a>
            </div>
            <nav
                className={classNames("webiny-cms-section-header__navigation", {
                    "webiny-cms-section-header__navigation--mobile-active": active
                })}
            >
                <Menu slug={menuName} component={DefaultMenu} />
                <div className={"webiny-cms-section-header__mobile-site-name"}>
                    <a href="/">{name}</a>
                </div>
            </nav>
            <div onClick={toggleMenu} className="webiny-cms-section-header__mobile-icon">
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
            <div
                onClick={toggleMenu}
                className={classNames("webiny-cms-section-header__mobile-overlay", {
                    "webiny-cms-section-header__mobile-overlay--active": active
                })}
            />
        </div>
    );
};

export { Header };
