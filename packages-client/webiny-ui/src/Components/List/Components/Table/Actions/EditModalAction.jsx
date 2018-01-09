import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import ModalAction from './ModalAction';

class EditModalAction extends Webiny.Ui.Component {

}

EditModalAction.defaultProps = {
    label: 'Edit',
    renderer() {
        const $this = this;
        return (
            <ModalAction {..._.pick($this.props, 'data', 'actions', 'label', 'hide', 'icon')}>
                {function render({data, actions, modal}) {
                    const props = _.omit($this.props.children.props, ['key', 'ref']);
                    _.assign(props, {data, actions, modal});
                    return React.cloneElement($this.props.children, props);
                }}
            </ModalAction>
        );
    }
};

export default EditModalAction;