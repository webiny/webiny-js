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
    public constructor(id: string, config: LabelElementConfig) {
        super(id, config);

        this.applyPlugins(LabelElement);
    }

    public getText(): string {
        return this.config.text;
    }

    public setText(text: string): void {
        this.config.text = text;
    }

    public override render(): React.ReactNode {
        return this.config.text;
    }
}
