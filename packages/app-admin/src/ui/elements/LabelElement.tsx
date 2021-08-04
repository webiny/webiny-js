import React from "react";
import { UIElement, UIElementConfig } from "~/ui/UIElement";

export interface LabelElementConfig extends UIElementConfig {
    text: string;
}

/**
 * !GOOD FIRST ISSUE!
 * Add support for `text` config and `setText` setter to accept functions.
 * See example in ButtonElement: packages/app-admin/src/ui/elements/ButtonElement.tsx
 */
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

    render(): React.ReactNode {
        return this.config.text;
    }
}
