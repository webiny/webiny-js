import React from 'react';
import {Webiny} from 'webiny-client';

class InlineStyle extends Webiny.Ui.Component {
}

InlineStyle.defaultProps = {
    icon: null,
    plugin: null,
    renderer() {
        const isActive = this.props.plugin.isActive();
        const disabled = this.props.plugin.isDisabled();
        const props = {
            style: this.props.style || {},
            className: this.props.className || '',
            disabled,
            type: isActive ? 'primary' : 'default',
            onClick: () => this.props.plugin.toggleStyle(),
            icon: this.props.icon,
            tooltip: this.props.tooltip
        };

        const {Button} = this.props;

        return (
            <Button {...props}/>
        );
    }
};

export default Webiny.createComponent(InlineStyle, {modules: ['Button']});