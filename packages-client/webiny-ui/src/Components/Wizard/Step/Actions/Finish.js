import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Ui.Wizard.Actions.Finish
 */
class Finish extends Webiny.Ui.Component {
}

// Receives all standard Button component props
Finish.defaultProps = {
    wizard: null,
    onClick: _.noop,
    label: Webiny.I18n('Finish'),
    renderer() {
        if (!this.props.wizard.isLastStep()) {
            return null;
        }

        const {Button} = this.props;
        const onClick = async () => {
            await this.props.onClick();
            this.props.wizard.form.validate().then(valid => valid && this.props.wizard.finish());
        };

        const props = _.assign({
            type: 'primary',
            onClick,
            align: 'right',
        }, _.omit(this.props, ['Button', 'onClick', 'renderer']));

        return <Button {...props}/>;
    }
};

export default Webiny.createComponent(Finish, {modules: ['Button']});