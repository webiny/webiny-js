import React from "react";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { View } from "@webiny/ui-composer/View";
import { PageSettingsTabElementRenderer } from "~/editor/views/PageSettingsView/PageSettingsTabElementRenderer";

export interface PageSettingsTabElementConfig extends ElementConfig {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
    view: View;
}

export class PageSettingsTabElement extends Element<PageSettingsTabElementConfig> {
    constructor(id: string, config: PageSettingsTabElementConfig) {
        super(id, config);
        this.useGrid(false);

        this.addRenderer(new PageSettingsTabElementRenderer());

        this.applyPlugins(PageSettingsTabElement);
    }

    setTitle(title: string) {
        this.config.title = title;
    }

    setDescription(description: string) {
        this.config.description = description;
    }

    setIcon(icon: React.ReactElement) {
        this.config.icon = icon;
    }

    setView(view: View) {
        this.config.view = view;
    }
}
