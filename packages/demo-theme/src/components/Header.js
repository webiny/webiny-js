//@flow
import * as React from "react";
import { Menu } from "webiny-app-cms/src/render/components";
import HamburgerMenu from "react-hamburger-menu";

class Header extends React.Component {
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
                    className={
                        "webiny-cms-section-header__navigation " +
                        (this.state.mobileMenuOpen &&
                            "webiny-cms-section-header__navigation--mobile-active")
                    }
                >
                    <Menu slug={"demo-menu"} component={"default"} />
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
                    className={
                        "webiny-cms-section-header__mobile-overlay " +
                        (this.state.mobileMenuOpen &&
                            "webiny-cms-section-header__mobile-overlay--active")
                    }
                />
                <div className={"webiny-cms-section-header__mobile-logo"}>
                    <a href="/">Logo</a>
                </div>
            </div>
        );
    }
}

export { Header };
