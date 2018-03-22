import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Form.Error
 */
class ContainerError extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { error, onClose, close, title, type, className, message } = this.props;
        if (!error) {
            return null;
        }

        if (_.isFunction(this.props.children)) {
            return this.props.children({ error });
        }

        const { Alert } = this.props;

        if (_.isString(error)) {
            return <Alert title={title} type={type} close={close}>{error}</Alert>;
        }

        const data = [];
        _.each(error.data.data, (value, key) => {
            data.push(<li key={key}><strong>{key}</strong> {value}</li>);
        });

        return (
            <Alert
                title={title}
                type={type}
                close={close}
                onClose={onClose}
                className={className}>
                {message || error.data.message}
                {data.length > 0 && <ul>{data}</ul>}
            </Alert>
        );
    }
}

ContainerError.defaultProps = {
    error: null,
    title: 'Oops',
    type: 'error',
    message: null,
    className: null,
    close: true,
    onClose: _.noop
};

export default createComponent(ContainerError, { modules: ['Alert'] });