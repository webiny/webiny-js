import React from 'react';
import classSet from "classnames";
import { app, createComponent } from 'webiny-app';
import _ from 'lodash';
import utils from './utils';

class Desktop extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.onClick = this.onClick.bind(this);

        this.menu = app.services.get('menu');

        /**
         * Menu renderer passed to <Menu>.
         * Note that `this` is still bound to `Desktop` class since we are passing an arrow function.
         */
        this.renderer = (menu) => {
            const props = _.clone(menu.props);
            if (!utils.canAccess(props)) {
                return null;
            }

            const children = React.Children.toArray(props.children);
            const hasChildren = children.length > 0;
            const { Link } = this.props;

            const menuIconClass = classSet('icon app-icon', { 'fa': _.includes(props.icon, 'fa-') }, props.icon);

            const linkProps = {
                key: props.id,
                label: props.label,
                children: [
                    props.icon ? <span key="icon" className={menuIconClass}/> : null,
                    props.level > 1 ? props.label : <span key="title" className="app-title">{props.label}</span>,
                    hasChildren && props.level > 0 ? <span key="caret" className="icon icon-caret-down"/> : null
                ]
            };

            const className = classSet({
                open: this.state.open === props.id,
                active: props.level === 0 ? utils.findRoute(props, app.router.route.name) : false
            });

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
            }

            return (
                <li className={className} key={props.id} onClick={() => this.onClick(menu)}>
                    {utils.getLink(props.route, Link, linkProps)}
                    {hasChildren && (
                        <ul className={'level-' + (props.level + 1)}>
                            {childMenuItems}
                        </ul>
                    )}
                </li>
            );
        }
    }

    componentDidMount() {
        this.setState({ active: utils.checkRoute(app.router.route) });
    }

    onClick(menu) {
        if (menu.props.level === 0) {
            this.setState({ open: menu.props.id });
        }
    }

    render() {
        return (
            <div className="navigation">
                <div className="shield"/>
                <div className="main-menu">
                    <ul className="menu-list level-0">
                        {this.menu.getMenu().map(menu => (
                            React.cloneElement(menu, {
                                key: menu.props.id,
                                render: this.renderer
                            })
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
}

export default createComponent(Desktop, { modules: ['Link'] });