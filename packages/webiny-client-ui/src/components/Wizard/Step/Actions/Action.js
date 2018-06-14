import React from "react";
import { inject } from "webiny-client";

@inject({ modules: ["Button"] })
class Action extends React.Component {
    render() {
        const {
            render,
            modules: { Button },
            ...props
        } = this.props;

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

export default Action;
