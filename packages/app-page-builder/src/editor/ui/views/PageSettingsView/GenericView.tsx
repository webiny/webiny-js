import { UIView } from "@webiny/app-admin/ui/UIView";

interface GenericViewRender {
    (props?: any): React.ReactNode;
}

/**
 * This view class serves as an adapter for plugins created using PbEditorPageSettingsPlugin class.
 */
export class GenericView extends UIView {
    private _render: GenericViewRender;

    constructor(id, render: GenericViewRender) {
        super(id);
        this._render = render;
    }

    render(props?: any): React.ReactNode {
        return this._render(props);
    }
}
