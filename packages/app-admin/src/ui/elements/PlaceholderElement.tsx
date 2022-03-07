import { UIElement } from "../UIElement";

export class PlaceholderElement extends UIElement {
    public override render(): React.ReactNode {
        return null;
    }

    public override remove(): void {
        return;
    }
}
