//@flow
import * as React from "react";
import { Menu } from "webiny-app-cms/src/render/components";
import HamburgerMenu from "react-hamburger-menu";
import classNames from "classnames";

type Props = null;
type State = {
    mobileMenuOpen: boolean
};

class Header extends React.Component<Props, State> {
    state = { mobileMenuOpen: false };

    toggleMobileMenu = () => {
        this.setState({
            mobileMenuOpen: !this.state.mobileMenuOpen
        });
    };

    render() {
        return (
            <div className={"webiny-cms-section-header"}>
                <div className={"webiny-cms-section-header__logo"}>
                    <a href="/">Logo</a>
                </div>
                <nav
                    className={classNames("webiny-cms-section-header__navigation", {
                        "webiny-cms-section-header__navigation--mobile-active": this.state
                            .mobileMenuOpen
                    })}
                >
                    <Menu slug={"demo-menu"} component={"default"} />
                    <div className={"webiny-cms-section-header__mobile-site-name"}>
                        <a href="/">Site Name</a>
                    </div>
                </nav>
                <div
                    onClick={this.toggleMobileMenu}
                    className="webiny-cms-section-header__mobile-icon"
                >
                    <HamburgerMenu
                        isOpen={this.state.mobileMenuOpen}
                        menuClicked={this.toggleMobileMenu}
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
                    onClick={this.toggleMobileMenu}
                    className={classNames("webiny-cms-section-header__mobile-overlay", {
                        "webiny-cms-section-header__mobile-overlay--active": this.state
                            .mobileMenuOpen
                    })}
                />
            </div>
        );
    }
}

export { Header };
