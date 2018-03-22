import React from "react";
import { createComponent, i18n } from "webiny-client";

/**
 * @i18n.namespace Webiny.Ui.Wizard.Actions.Previous
 */
class Previous extends React.Component {
    render() {
        const { Button, render, wizard, onClick, ...props } = this.props;

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
    label: i18n("Back")
};
export default createComponent(Previous, { modules: ["Button"] });
