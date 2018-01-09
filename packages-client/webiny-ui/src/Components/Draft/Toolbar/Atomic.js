import React from 'react';
import {Webiny} from 'webiny-client';

class Atomic extends Webiny.Ui.Component {
}

Atomic.defaultProps = {
    plugin: null,
    icon: null,
    renderer() {
        const disabled = this.props.plugin.isDisabled();
        const props = {
            style: this.props.style || {},
            className: this.props.className || '',
            disabled,
            type: 'default',
            onClick: () => this.props.plugin.createBlock(),
            icon: this.props.icon,
            tooltip: this.props.tooltip
        };

        const {Button} = this.props;

        return (
            <Button {...props}>{this.props.children}</Button>
        );
    }
};

export default Webiny.createComponent(Atomic, {modules: ['Button']});