import React from "react";
import { Element, ElementConfig } from "../Element";
import { View, ViewComponent } from "../View";

interface ViewElementConfig extends ElementConfig {
    view: View;
}

export class ViewElement extends Element<ViewElementConfig> {
    constructor(id: string, config: ViewElementConfig) {
        super(id, config);
        config.view.setParent(this);
    }

    render(props?: any): React.ReactNode {
        if (!this.config.view) {
            return null;
        }

        return <ViewComponent {...props} view={this.config.view} />;
    }
}
