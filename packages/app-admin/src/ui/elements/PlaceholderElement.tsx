import { UIElement } from "../UIElement";

export class PlaceholderElement extends UIElement {
    public render(): React.ReactNode {
        return null;
    }

    public remove(): void {
        return;
    }
}
