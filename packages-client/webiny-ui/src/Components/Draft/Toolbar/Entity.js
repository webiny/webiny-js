import React from 'react';
import {Webiny} from 'webiny-client';

class Entity extends Webiny.Ui.Component {
}

Entity.defaultProps = {
    plugin: null,
    icon: null,
    renderer() {
        const isActive = this.props.plugin.isActive();
        const disabled = this.props.plugin.isDisabled();
        const click = isActive ? this.props.plugin.removeEntity : this.props.plugin.setEntity;
        const props = {
            style: this.props.style || {},
            className: this.props.className || '',
            disabled,
            type: isActive ? 'primary' : 'default',
            onClick: click.bind(this.props.plugin),
            icon: this.props.icon,
            tooltip: this.props.tooltip
        };

        const {Button} = this.props;

        return (
            <Button {...props}>{this.props.children}</Button>
        );
    }
};

export default Webiny.createComponent(Entity, {modules: ['Button']});