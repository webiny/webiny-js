import { UIElement } from "@webiny/app-admin/ui/UIElement";
import { FormView } from "@webiny/app-admin/ui/views/FormView";
import { PageSettingsView } from "../PageSettingsView";
import { UsePageSettings } from "~/pageEditor/hooks/usePageSettings";

export class PageSettingsFormView extends FormView {
    constructor(id: string) {
        super(id, { setupForm: false });

        this.getSubmitButtonElement().setLabel("Save Settings");
        this.applyPlugins(PageSettingsFormView);
    }

    /**
     * Add a field to form content.
     */
    public addField<TElement extends UIElement = UIElement>(element: TElement): TElement {
        return this.getFormContentElement().addElement<TElement>(element);
    }

    public getPageSettingsHook(): UsePageSettings {
        const parent = this.getParentByType<PageSettingsView>(PageSettingsView);
        return parent.getPageSettingsHook();
    }
}
