import React from "react";
import { UIView } from "@webiny/app-admin/ui/UIView";

interface GenericViewRender {
    /**
     * Figure out better types.
     * @param props
     */
    // TODO @ts-refactor
    (props?: Record<string, any>): React.ReactNode;
}

/**
 * This view class serves as an adapter for plugins created using PbEditorPageSettingsPlugin class.
 */
export class GenericView extends UIView {
    private readonly _render: GenericViewRender;

    public constructor(id: string, render: GenericViewRender) {
        super(id);
        this._render = render;
    }

    public override render(props?: Record<string, any>): React.ReactNode {
        return this._render(props);
    }
}
