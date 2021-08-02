import { UIElement } from "@webiny/ui-composer/UIElement";
import { EmptyStateElementRenderer } from "./EmptyStateElementRenderer";

export class EmptyStateElement extends UIElement<any> {
    constructor(id: string) {
        super(id);

        this.addRenderer(new EmptyStateElementRenderer());
    }
}
