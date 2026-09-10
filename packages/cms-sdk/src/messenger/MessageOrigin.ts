export class MessageOrigin {
    private readonly getWindow: () => Window;
    public readonly origin: string;

    constructor(getWindow: () => Window, origin: string) {
        this.getWindow = getWindow;
        this.origin = origin;
    }

    matches(event: MessageEvent): boolean {
        return event.origin === this.origin;
    }

    get window() {
        return this.getWindow();
    }
}
