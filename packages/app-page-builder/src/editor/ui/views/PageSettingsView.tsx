import { plugins } from "@webiny/plugins";
import { SplitView } from "@webiny/app-admin/ui/views/SplitView";
import { ViewElement } from "@webiny/app-admin/ui/elements/ViewElement";
import { OverlayView } from "@webiny/app-admin/ui/views/OverlayView";
import { UsePageSettings, usePageSettings } from "~/pageEditor/hooks/usePageSettings";
import {
    PageSettingsTabElement,
    PageSettingsTabElementConfig
} from "~/editor/ui/views/PageSettingsView/PageSettingsTabElement";
import { PageSettingsTabsElement } from "~/editor/ui/views/PageSettingsView/PageSettingsTabsElement";
import { PbEditorPageSettingsPlugin } from "~/plugins/PbEditorPageSettingsPlugin";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import {
    FormElement,
    FormElementRenderProps
} from "@webiny/app-admin/ui/elements/form/FormElement";
import { FormView } from "@webiny/app-admin/ui/views/FormView";
import { SplitViewPanelElement } from "@webiny/app-admin/ui/views/SplitView/SplitViewPanelElement";

export class PageSettingsView extends OverlayView {
    private _splitView?: SplitView;
    private _sections = new Map<string, PageSettingsTabElementConfig>();
    private _tabs?: PageSettingsTabsElement;
    private _form?: FormElement;

    public constructor() {
        super("PageSettingsView");

        this.addHookDefinition("pageSettings", usePageSettings);

        this.addOnExited(() => {
            this.getPageSettingsHook().closeSettings();
        });

        this.setTitle(() => "Page Settings");

        this.setupView();
        this.applyPlugins(PageSettingsView);

        this.setupLegacyPlugins();

        // Show this view as soon as it's mounted.
        this.isRendered().then(() => this.setIsVisible(true));
    }

    public getLeftPanel(): SplitViewPanelElement | null {
        if (!this._splitView) {
            return null;
        }
        return this._splitView.getLeftPanel();
    }

    public getRightPanel(): SplitViewPanelElement | null {
        if (!this._splitView) {
            return null;
        }
        return this._splitView.getRightPanel();
    }

    public addSection(section: PageSettingsTabElementConfig): void {
        this._sections.set(section.id, section);

        if (this._tabs) {
            this._tabs.addElement(new PageSettingsTabElement(section.id, section));
        }
        if (!this._form) {
            return;
        }
        this._form.addElement(
            new ViewElement(section.id, {
                view: section.view,
                shouldRender: () => {
                    const { activeSection } = this.getPageSettingsHook();
                    if (!activeSection && section.id === "general") {
                        return true;
                    }

                    return this.getPageSettingsHook().activeSection === section.id;
                }
            })
        );
    }

    public getActiveSection(): PageSettingsTabElementConfig | null {
        const { activeSection } = this.getPageSettingsHook();
        if (!activeSection) {
            return this._sections.values().next().value;
        }
        return this._sections.get(activeSection) || null;
    }

    public getPageSettingsHook(): UsePageSettings {
        return this.getHook<UsePageSettings>("pageSettings");
    }

    private setupView() {
        this._splitView = new SplitView("pageSettingsContent");

        this._form = new FormElement("form", {
            onSubmit: data => this.getPageSettingsHook().savePage(data),
            getData: () => this.getPageSettingsHook().pageData
        });

        this.getContentElement().addElement(
            new ViewElement("pageSettingsContent", { view: this._splitView })
        );
        this._tabs = this._splitView.getLeftPanel().addElement(new PageSettingsTabsElement("tabs"));
        const rightPanel = this.getRightPanel();
        if (!rightPanel) {
            return;
        }
        rightPanel.addElement(this._form);
    }

    private setupLegacyPlugins() {
        // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!
        const oldPlugins = plugins.byType<PbEditorPageSettingsPlugin>(
            PbEditorPageSettingsPlugin.type
        );

        oldPlugins.forEach(pl => {
            const formView = new FormView(pl.name as string);
            formView.setTitle(() => pl.title);
            formView.setFormData(() => this.getPageSettingsHook().pageData);
            formView.setOnSubmit(data => this.getPageSettingsHook().savePage(data));
            formView.getFormContentElement().addElement(
                new GenericElement<FormElementRenderProps>("fields", props => {
                    return pl.render(props.formProps);
                })
            );

            this.addSection({
                id: pl.name as string,
                title: pl.title,
                description: pl.description,
                icon: pl.icon,
                view: formView
            });
        });
    }
}
