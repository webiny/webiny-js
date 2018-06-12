import React from "react";
import classSet from "classnames";
import { app, createComponent } from "webiny-client";
import _ from "lodash";
import $ from "jquery";
import utils from "./utils";

class Mobile extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.menu = app.services.get("menu");

        this.onClick = this.onClick.bind(this);

        /**
         * Menu renderer passed to <Menu>.
         * Note that `this` is still bound to `Mobile` class since we are passing an arrow function.
         */
        this.renderer = menu => {
            const props = _.clone(menu.props);
            if (!utils.canAccess(props)) {
                return null;
            }

            const { level } = props;
            const { Link } = this.props.modules;
            const children = React.Children.toArray(props.children);
            const hasChildren = children.length > 0;

            const menuIconClass = classSet(
                "icon app-icon",
                { fa: _.includes(props.icon, "fa-") },
                props.icon
            );

            const linkProps = {
                key: props.id,
                label: props.label,
                onClick: this.closeMobileMenu,
                children: [
                    props.icon ? <span key="icon" className={menuIconClass} /> : null,
                    level > 1 ? (
                        props.label
                    ) : (
                        <span key="title" className="app-title">
                            {props.label}
                        </span>
                    ),
                    hasChildren ? (
                        <span key="caret" className="icon icon-caret-down mobile-caret" />
                    ) : null
                ]
            };

            let childMenuItems = null;
            if (hasChildren) {
                // Build array of child items and check their access roles.
                childMenuItems = children.map((child, i) => {
                    if (!utils.canAccess(child.props)) {
                        return null;
                    }

                    return React.cloneElement(child, { key: i, render: this.renderer });
                });

                // If no child items are there to render - hide parent menu as well.
                if (!childMenuItems.filter(item => !_.isNil(item)).length) {
                    return null;
                }
                linkProps.onClick = e => this.onClick(menu, e);
            }

            const className = classSet({
                open: this.state[props.id],
                active: props.level === 0 ? utils.findRoute(props, app.router.route.name) : false
            });

            return (
                <li className={className} key={props.id}>
                    {utils.getLink(props.route, Link, linkProps)}
                    {hasChildren && (
                        <ul className={"level-" + (level + 1)}>
                            <li
                                className="main-menu--close back"
                                onClick={e => this.onClick(menu, e)}
                            >
                                Go Back
                            </li>
                            {childMenuItems}
                        </ul>
                    )}
                </li>
            );
        };
    }

    onClick(menu, e) {
        e.stopPropagation();
        const state = this.state;
        state[menu.props.id] = !_.get(state, menu.props.id, false);
        this.setState(state);
    }

    closeMobileMenu() {
        $("body").removeClass("mobile-nav");
    }

    render() {
        return (
            <div className="navigation">
                <div className="shield" />
                <div className="main-menu">
                    <ul className="menu-list level-0">
                        <li className="main-menu--close" onClick={this.closeMobileMenu}>
                            Close
                        </li>
                        {this.menu.getMenu().map(menu =>
                            React.cloneElement(menu, {
                                key: menu.props.id,
                                render: this.renderer
                            })
                        )}
                    </ul>
                </div>
            </div>
        );
    }
}

export default createComponent(Mobile, { modules: ["Link"] });
