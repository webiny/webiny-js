import React from 'react';
import {Webiny} from 'webiny-client';

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

class Col extends Webiny.Ui.Component {
    // This component doesn't do anything beyond rendering itself
}

Col.defaultProps = {
    className: null,
    style: null,
    renderer() {
        let props = Object.assign({}, this.props);
        let cssClasses = [];

        const cls = typeof props.className === 'string'  ? props.className.trim() : '';
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


        ['children', 'renderer', 'className', 'all', 'renderIf'].concat(Object.keys(propsMap)).forEach(key => delete props[key]);

        return (
            <div className={this.classSet(cssClasses)} {...props}>
                {this.props.children}
            </div>
        );
    }
};

export default Col;
