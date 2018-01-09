import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Button extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            enabled: true
        };
    }

    disable() {
        this.setState({enabled: false});
    }

    enable() {
        this.setState({enabled: true});
    }
}

Button.defaultProps = {
    size: 'normal',
    type: 'default',
    align: 'normal',
    icon: null,
    className: null,
    style: null,
    label: null,
    onClick: _.noop,
    tooltip: null,
    disabled: false,
    renderer() {
        const props = _.clone(this.props);
        const {Tooltip, Icon, styles} = props;

        if (props.disabled || !this.state.enabled) {
            props['disabled'] = true;
        }

        const sizeClasses = {
            normal: '',
            large: styles.btnLarge,
            //small: 'btn-sm' // sven: this option doesn't exist in css
        };

        const alignClasses = {
            normal: '',
            left: 'pull-left',
            right: 'pull-right'
        };

        const typeClasses = {
            default: styles.btnDefault,
            primary: styles.btnPrimary,
            secondary: styles.btnSuccess
        };

        const classes = this.classSet(
            sizeClasses[props.size],
            alignClasses[props.align],
            typeClasses[props.type],
            props.className
        );

        const icon = this.props.icon ? <Icon icon={this.props.icon} className={styles.icon + ' ' + styles.iconRight}/> : null;
        let content = props.children || props.label;
        if (icon) {
            content = <span>{content}</span>;
        }

        const buttonProps = _.pick(props, ['style', 'disabled']);
        buttonProps.onClick = e => this.props.onClick({event: e});
        _.assign(buttonProps, {
            type: 'button',
            className: classes,
        });
        let button = <button {...buttonProps}>{icon} {content}</button>;

        if (this.props.tooltip) {
            button = <Tooltip target={button} placement="top">{this.props.tooltip}</Tooltip>;
        }

        return button;
    }
};

export default Webiny.createComponent(Button, {styles, modules: ['Tooltip', 'Icon']});
