import { UIElement } from "~/ui/UIElement";
import { EmptyStateElementRenderer } from "./EmptyStateElementRenderer";

export class EmptyStateElement extends UIElement<any> {
    constructor(id: string) {
        super(id);

        this.addRenderer(new EmptyStateElementRenderer());
    }
}
