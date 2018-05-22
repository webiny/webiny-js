import React from "react";
import { createComponent } from "webiny-app";

class WidgetSettingsContainer extends React.Component {
    render() {
        const { children, Bind, ...props } = this.props;
        return React.cloneElement(children, { Bind, ...props });
    }
}

export default createComponent(WidgetSettingsContainer);
