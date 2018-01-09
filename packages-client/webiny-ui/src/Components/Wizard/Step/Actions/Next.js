import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Ui.Wizard.Actions.Previous
 */
class Next extends Webiny.Ui.Component {
}

// Receives all standard Button component props
Next.defaultProps = {
    wizard: null,
    onClick: _.noop,
    label: Webiny.I18n('Next'),
    renderer() {
        if (this.props.wizard.isLastStep()) {
            return null;
        }

        const {Button} = this.props;

        const onClick = async () => {
            await this.props.onClick();
            this.props.wizard.form.validate().then(valid => valid && this.props.wizard.nextStep());
        };

        const props = _.assign({
            type: 'primary',
            onClick,
            align: 'right',
            icon: 'fa-arrow-circle-right',
        }, _.omit(this.props, ['Button', 'onClick', 'renderer']));

        return <Button {...props}/>;
    }
};

export default Webiny.createComponent(Next, {modules: ['Button']});