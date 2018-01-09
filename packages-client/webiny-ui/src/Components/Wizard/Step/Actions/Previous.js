import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Ui.Wizard.Actions.Previous
 */
class Previous extends Webiny.Ui.Component {
}

// Receives all standard Button component props
Previous.defaultProps = {
    wizard: null,
    onClick: null,
    label: Webiny.I18n('Back'),
    renderer() {
        if (this.props.wizard.isFirstStep()) {
            return null;
        }

        const {Button} = this.props;
        const props = _.assign({
            type: 'default',
            onClick: _.isFunction(this.props.onClick) ? this.props.onClick : this.props.wizard.previousStep,
        }, _.omit(this.props, ['Button', 'onClick', 'renderer']));

        return <Button {...props}/>;
    }
};
export default Webiny.createComponent(Previous, {modules: ['Button']});