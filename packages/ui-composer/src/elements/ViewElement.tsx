import React from "react";
import { UIElement, UIElementConfig } from "../UIElement";
import { UIView, UIViewComponent } from "../UIView";

interface ViewElementConfig extends UIElementConfig {
    view: UIView;
}

export class ViewElement extends UIElement<ViewElementConfig> {
    constructor(id: string, config: ViewElementConfig) {
        super(id, config);
        config.view.setParent(this);
    }

    render(props?: any): React.ReactNode {
        if (!this.config.view) {
            return null;
        }

        return <UIViewComponent {...props} view={this.config.view} />;
    }
}
