import React from "react";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";

export interface LabelElementConfig extends ElementConfig {
    text: string;
}

export class LabelElement extends Element<LabelElementConfig> {
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
