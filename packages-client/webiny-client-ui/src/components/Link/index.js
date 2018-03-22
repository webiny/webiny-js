import React from 'react';
import _ from 'lodash';
import classSet from 'classnames';
import { app, createComponent } from 'webiny-client';
import styles from './styles.css';

class Link extends React.Component {

    constructor(props) {
        super(props);

        this.getLinkProps = this.getLinkProps.bind(this);
    }

    getLinkProps() {
        const props = _.clone(this.props);
        const { styles } = this.props;

        props.href = 'javascript:void(0)';

        if (!props.disabled) {
            if (props.mailTo) {
                props.href = 'mailto:' + props.mailTo
            } else if (props.url) {
                // Let's ensure we have at least http:// specified - for cases where users just type www...
                if (!/^(f|ht)tps?:\/\//i.test(props.url) && !props.url.startsWith('/')) {
                    props.url = 'http://' + props.url;
                }
                props.href = props.url;
            } else if (props.route) {
                let route = props.route;
                if (_.isString(route)) {
                    route = route === 'current' ? app.router.getActiveRoute() : app.router.getRoute(route);
                }

                if (!route) {
                    props.href = 'javascript:void(0)';
                } else {
                    props.href = app.router.createHref(route.name, props.params);
                    if (props.href.startsWith('//')) {
                        props.href = props.href.substring(1); // Get everything after first character (after first slash)
                    }
                }
            }
        }

        if (props.separate || props.newTab) {
            props.target = '_blank';
        }

        const typeClasses = {
            default: styles.btnDefault,
            primary: styles.btnPrimary,
            secondary: styles.btnSuccess
        };

        const alignClasses = {
            normal: '',
            left: 'pull-left',
            right: 'pull-right'
        };

        const sizeClasses = {
            normal: '',
            large: styles.btnLarge,
            //small: 'btn-sm' // sven: this option doesn't exist in css
        };

        const classes = {};

        if (this.props.type) {
            classes[typeClasses[this.props.type]] = true;
        }

        if (this.props.size) {
            classes[sizeClasses[this.props.size]] = true;
        }

        if (this.props.align) {
            classes[alignClasses[props.align]] = true;
        }

        if (this.props.className) {
            classes[this.props.className] = true;
        }

        if (this.props.disabled) {
            classes[styles.disabled] = true;
        }

        props.className = classSet(classes);

        if (props.preventScroll) {
            props['data-prevent-scroll'] = true;
        }

        if (props.documentTitle) {
            props['data-document-title'] = props.documentTitle;
        }

        const finalProps = [];
        _.each(props, (value, prop) => {
            if (this.allowedProps.includes(prop) || prop.startsWith('data-')) {
                finalProps[prop] = value;
            }
        });

        if (props.onClick) {
            props.onClick = e => this.props.onClick({ event: e });
        }
        return finalProps;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <a {...this.getLinkProps()}>{this.props.children}</a>
        );
    }
}

// We can define this on prototype since it is not going to change between instances and we want to it accessible via "this"
Link.prototype.allowedProps = ['className', 'style', 'target', 'href', 'onClick', 'title', 'tabIndex'];

Link.defaultProps = {
    align: null,
    type: null,
    size: null,
    url: null,
    mailTo: null,
    title: null,
    route: null,
    preventScroll: false,
    params: {},
    separate: false,
    newTab: false,
    className: null,
    tabIndex: null,
    onClick: null
};

export default createComponent(Link, { styles });
