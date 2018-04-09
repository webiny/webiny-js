import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class ContainerError extends React.Component {
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

        if (_.isString(error)) {
            return (
                <Alert title={title} type={type} close={close}>
                    {error}
                </Alert>
            );
        }

        /*const data = [];
        _.each(Object.values(error.data), (value, key) => {
            data.push(
                <li key={key}>
                    <strong>{key}</strong> {value.message}
                </li>
            );
        });*/

        return (
            <Alert title={title} type={type} close={close} onClose={onClose} className={className}>
                {message || error.message}
                {/*{data.length > 0 && <ul>{data}</ul>}*/}
            </Alert>
        );
    }
}

ContainerError.defaultProps = {
    error: null,
    title: "Oops",
    type: "error",
    message: null,
    className: null,
    close: true,
    onClose: _.noop
};

export default createComponent(ContainerError, { modules: ["Alert"] });
