import React from "react";
import { UIElement, UIElementConfig } from "~/UIElement";
import { UIView, UIViewComponent } from "~/UIView";

interface ViewElementConfig extends UIElementConfig {
    view: UIView;
}

export class ViewElement extends UIElement<ViewElementConfig> {
    constructor(id: string, config: ViewElementConfig) {
        super(id, config);
        config.view.setParent(this);
    }

    getChildren(): UIElement[] {
        return this.config.view.getChildren();
    }

    getDescendentsByType<TElement extends UIElement = UIElement>(type: any): TElement[] {
        return this.config.view.getDescendentsByType(type) as TElement[];
    }

    render(props?: any): React.ReactNode {
        if (!this.config.view) {
            return null;
        }

        return <UIViewComponent {...props} view={this.config.view} />;
    }
}
