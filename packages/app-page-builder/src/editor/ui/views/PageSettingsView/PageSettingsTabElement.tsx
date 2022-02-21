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
    public constructor(id: string, config: PageSettingsTabElementConfig) {
        super(id, config);
        this.useGrid(false);

        this.addRenderer(new PageSettingsTabElementRenderer());

        this.applyPlugins(PageSettingsTabElement);
    }

    public setTitle(title: string): void {
        this.config.title = title;
    }

    public setDescription(description: string): void {
        this.config.description = description;
    }

    public setIcon(icon: React.ReactElement): void {
        this.config.icon = icon;
    }

    public setView(view: UIView): void {
        this.config.view = view;
    }
}
