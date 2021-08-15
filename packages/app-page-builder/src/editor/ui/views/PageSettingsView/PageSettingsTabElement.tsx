import React from "react";
import { UIElement, UIElementConfig } from "@webiny/app-admin/ui/UIElement";
import { UIView } from "@webiny/app-admin/ui/UIView";
import { PageSettingsTabElementRenderer } from "~/editor/ui/views/PageSettingsView/PageSettingsTabElementRenderer";

export interface PageSettingsTabElementConfig extends UIElementConfig {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
    view: UIView;
}

export class PageSettingsTabElement extends UIElement<PageSettingsTabElementConfig> {
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

    setView(view: UIView) {
        this.config.view = view;
    }
}
