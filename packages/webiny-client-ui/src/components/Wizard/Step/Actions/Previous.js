import React from "react";
import { Component, i18n } from "webiny-client";

const t = i18n.namespace("Webiny.Ui.Wizard.Actions.Previous");
@Component({ modules: ["Button"] })
class Previous extends React.Component {
    render() {
        const {
            modules: { Button },
            render,
            wizard,
            onClick,
            ...props
        } = this.props;

        if (render) {
            return render.call(this);
        }

        if (wizard.isFirstStep()) {
            return null;
        }

        const btnProps = {
            type: "default",
            onClick: typeof onClick === "function" ? onClick : wizard.previousStep,
            ...props
        };

        return <Button {...btnProps} />;
    }
}

// Receives all standard Button component props
Previous.defaultProps = {
    wizard: null,
    onClick: null,
    label: t`Back`
};
export default Previous;
