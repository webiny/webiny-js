import React from 'react';
import classSet from "classnames";

const propsMap = {
    xs: 'xs',
    xsOffset: 'xs-offset',
    xsPull: 'xs-pull',
    xsPush: 'xs-push',
    sm: 'sm',
    smOffset: 'sm-offset',
    smPull: 'sm-pull',
    smPush: 'sm-push',
    md: 'md',
    mdOffset: 'md-offset',
    mdPull: 'md-pull',
    mdPush: 'md-push',
    lg: 'lg',
    lgOffset: 'lg-offset',
    lgPull: 'lg-pull',
    lgPush: 'lg-push'
};

function getCssClass(key, val) {
    if (key === 'all') {
        return `${getCssClass('md', val)}`;
    }
    return propsMap[key] ? `col-${propsMap[key]}-${val}` : false;
}

class Col extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let props = Object.assign({}, this.props);
        let cssClasses = [];

        const cls = typeof props.className === 'string' ? props.className.trim() : '';
        if (cls !== '') {
            cssClasses = cls.split(' ');
        }
        delete props['className'];

        Object.keys(props).forEach(key => {
            const newClass = getCssClass(key, props[key]);
            if (newClass) {
                cssClasses.push(newClass);
            }
        });


        ['children', 'render', 'className', 'all'].concat(Object.keys(propsMap)).forEach(key => delete props[key]);

        return (
            <div className={classSet(cssClasses)} {...props}>
                {this.props.children}
            </div>
        );
    }
}

Col.defaultProps = {
    className: null,
    style: null
};

export default Col;
