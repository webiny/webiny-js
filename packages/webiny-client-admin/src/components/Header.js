import React, { createElement, isValidElement } from "react";
import $ from "jquery";
import { app, createComponent } from "webiny-client";

class Header extends React.Component {
    toggleMobile() {
        $("body").toggleClass("mobile-nav");
    }

    render() {
        const { components } = this.props.modules;
        return (
            <div className="navbar navbar-inverse" role="navigation">
                <div className="navbar-header">
                    <button type="button" className="nav" onClick={this.toggleMobile}>
                        <span />
                        <span />
                        <span />
                    </button>
                    {components.map((cmp, index) => {
                        return (
                            cmp &&
                            React.cloneElement(isValidElement(cmp) ? cmp : createElement(cmp), {
                                key: index
                            })
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default createComponent(Header, {
    modules: [
        {
            components: () =>
                app.modules.loadByTag("header-component").then(modules => {
                    return Object.values(modules).filter(m => m);
                })
        }
    ]
});
