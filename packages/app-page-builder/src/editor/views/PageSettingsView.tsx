import { plugins } from "@webiny/plugins";
import { SplitView } from "@webiny/app-admin/views/SplitView";
import { ViewElement } from "@webiny/ui-composer/elements/ViewElement";
import { OverlayView } from "@webiny/app-admin/views/OverlayView";
import { UsePageSettings, usePageSettings } from "~/editor/hooks/usePageSettings";
import {
    PageSettingsTabElement,
    PageSettingsTabElementConfig
} from "~/editor/views/PageSettingsView/PageSettingsTabElement";
import { PageSettingsTabsElement } from "~/editor/views/PageSettingsView/PageSettingsTabsElement";
import { PbEditorPageSettingsPlugin } from "~/plugins/PbEditorPageSettingsPlugin";
import { SimpleFormView } from "@webiny/app-admin/elements/SimpleFormView";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { FormElement, FormElementRenderProps } from "@webiny/app-admin/elements/FormElement";

export class PageSettingsView extends OverlayView {
    private _splitView: SplitView;
    private _sections = new Map<string, PageSettingsTabElementConfig>();
    private _tabs: PageSettingsTabsElement;
    private _form: FormElement;

    constructor() {
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

    getLeftPanel() {
        return this._splitView.getLeftPanel();
    }

    getRightPanel() {
        return this._splitView.getRightPanel();
    }

    addSection(section: PageSettingsTabElementConfig) {
        this._sections.set(section.id, section);

        this._tabs.addElement(new PageSettingsTabElement(section.id, section));
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

    getActiveSection(): PageSettingsTabElementConfig {
        const { activeSection } = this.getPageSettingsHook();
        if (!activeSection) {
            return this._sections.values().next().value;
        }
        return this._sections.get(activeSection);
    }

    getPageSettingsHook() {
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
        this.getRightPanel().addElement(this._form);
    }

    private setupLegacyPlugins() {
        // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!
        const oldPlugins = plugins.byType<PbEditorPageSettingsPlugin>(
            PbEditorPageSettingsPlugin.type
        );

        oldPlugins.forEach(pl => {
            const formView = new SimpleFormView(pl.name);
            formView.setTitle(() => pl.title);
            formView.setFormData(() => this.getPageSettingsHook().pageData);
            formView.setOnSubmit(data => this.getPageSettingsHook().savePage(data));
            formView.getFormContentElement().addElement(
                new GenericElement<FormElementRenderProps>("fields", props => {
                    return pl.render(props.formProps);
                })
            );

            this.addSection({
                id: pl.name,
                title: pl.title,
                description: pl.description,
                icon: pl.icon,
                view: formView
            });
        });
    }
}
