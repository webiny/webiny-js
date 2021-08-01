import React from "react";
import { UIElement, UIElementConfig } from "@webiny/ui-composer/UIElement";

export interface LabelElementConfig extends UIElementConfig {
    text: string;
}

export class LabelElement extends UIElement<LabelElementConfig> {
    constructor(id: string, config: LabelElementConfig) {
        super(id, config);

        this.applyPlugins(LabelElement);
    }

    getText() {
        return this.config.text;
    }

    setText(text: string) {
        this.config.text = text;
    }

    render(props: any): React.ReactNode {
        return this.config.text;
    }
}
