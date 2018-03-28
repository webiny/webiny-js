import React from "react";
import { createComponent } from "webiny-app";

class Action extends React.Component {
    render() {
        const { render, Button, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        return <Button {...props} />;
    }
}

// Receives all standard Button component props
Action.defaultProps = {
    wizard: null
};

export default createComponent(Action, { modules: ["Button"] });
