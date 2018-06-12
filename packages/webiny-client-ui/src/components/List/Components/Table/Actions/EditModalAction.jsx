import React from 'react';
import _ from 'lodash';
import ModalAction from './ModalAction';

class EditModalAction extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const $this = this;
        return (
            <ModalAction {..._.pick($this.props, 'data', 'actions', 'label', 'hide', 'icon')}>
                {function render({ data, actions, modal }) {
                    const props = _.omit($this.props.children.props, ['key', 'ref']);
                    _.assign(props, { data, actions, modal });
                    return React.cloneElement($this.props.children, props);
                }}
            </ModalAction>
        );
    }
}

EditModalAction.defaultProps = {
    label: 'Edit',
    icon: ['fas', 'pencil-alt']
};

export default EditModalAction;