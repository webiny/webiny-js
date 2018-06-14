import React from "react";
import { Component } from "webiny-client";

@Component({ modules: ["Input"] })
class Email extends React.Component {
    render() {
        const {
            modules: { Input },
            render,
            ...props
        } = this.props;
        if (render) {
            return render.call(this);
        }

        if (props.onChange) {
            props.onChange = (value, cb) => {
                return this.props.onChange(value ? value.toLowerCase().trim() : value, cb);
            };
        }

        return <Input {...props} />;
    }
}

export default Email;
