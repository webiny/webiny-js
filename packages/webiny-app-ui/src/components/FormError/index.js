import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class FormError extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { Alert },
            error,
            onClose,
            close,
            title,
            type,
            className,
            message
        } = this.props;

        if (!error) {
            return null;
        }

        if (_.isFunction(this.props.children)) {
            return this.props.children({ error });
        }

        const data = [];
        const { invalidAttributes = {} } = error.data;
        _.each(invalidAttributes, (value, key) => {
            data.push(
                <li key={key}>
                    <strong>{key}</strong> {value.data.message}
                </li>
            );
        });

        return (
            <Alert title={title} type={type} close={close} onClose={onClose} className={className}>
                {message || error.message}
                {data.length > 0 && <ul>{data}</ul>}
            </Alert>
        );
    }
}

FormError.defaultProps = {
    error: null,
    title: "Oops",
    type: "error",
    message: null,
    className: null,
    close: true,
    onClose: _.noop
};

export default createComponent(FormError, { modules: ["Alert"] });
