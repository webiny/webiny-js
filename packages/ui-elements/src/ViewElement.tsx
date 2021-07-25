import React from "react";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { View, ViewComponent } from "@webiny/ui-composer/View";

interface ViewElementConfig extends ElementConfig {
    view: View;
    hook?: Function;
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

        return <ViewComponent view={this.config.view} />;
    }
}
