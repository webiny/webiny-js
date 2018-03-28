import React from "react";
import { createComponent } from "webiny-app";

class FormLoader extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (!this.props.show) {
            return null;
        }

        if (typeof this.props.children === "function") {
            return this.props.children();
        }

        const { Loader } = this.props;

        return <Loader>{this.props.children}</Loader>;
    }
}

FormLoader.defaultProps = {
    show: false
};

export default createComponent(FormLoader, { modules: ["Loader"] });
