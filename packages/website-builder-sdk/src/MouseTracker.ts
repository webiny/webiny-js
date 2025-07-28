type MousePosition = { x: number; y: number };
type MousePositionCallback = (pos: MousePosition) => void;

interface IMouseTracker {
    get x(): number;
    get y(): number;
    start(): void;
    stop(): void;
    subscribe(cb: MousePositionCallback): () => void;
    setPosition(x: number, y: number): void;
}

export class MouseTracker implements IMouseTracker {
    private latest: MousePosition | null = null;
    private lastSent: MousePosition | null = null;
    private callbacks = new Set<MousePositionCallback>();
    private frameId: number | null = null;
    private listener: ((e: MouseEvent) => void) | null = null;
    private isTracking = false;
    private readonly window: Window;

    constructor(window: Window) {
        this.window = window;
    }

    start() {
        if (this.isTracking) {
            return;
        }

        this.isTracking = true;

        this.listener = (e: MouseEvent) => {
            this.latest = { x: e.clientX, y: e.clientY };
        };

        this.window.addEventListener("mousemove", this.listener);

        const loop = () => {
            if (this.latest) {
                const { x, y } = this.latest;
                if (!this.lastSent || x !== this.lastSent.x || y !== this.lastSent.y) {
                    this.lastSent = { x, y };
                    this.callbacks.forEach(cb => cb({ x, y }));
                }
            }
            this.frameId = this.window.requestAnimationFrame(loop);
        };

        this.frameId = this.window.requestAnimationFrame(loop);
    }

    stop() {
        if (!this.isTracking) {
            return;
        }

        this.isTracking = false;

        if (this.listener) {
            this.window.removeEventListener("mousemove", this.listener);
            this.listener = null;
        }

        if (this.frameId !== null) {
            this.window.cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        this.latest = null;
        this.lastSent = null;
    }

    subscribe(cb: MousePositionCallback): () => void {
        this.callbacks.add(cb);
        return () => this.callbacks.delete(cb);
    }

    get x(): number {
        return this.latest?.x ?? 0;
    }

    get y(): number {
        return this.latest?.y ?? 0;
    }

    setPosition(x: number, y: number) {
        this.latest = { x, y };
    }
}

class NullMouseTracker implements IMouseTracker {
    get x(): number {
        return 0;
    }

    get y(): number {
        return 0;
    }

    setPosition(): void {}

    start(): void {}

    stop(): void {}

    subscribe(): () => void {
        return function () {};
    }
}

export const mouseTracker =
    typeof window !== "undefined" ? new MouseTracker(window) : new NullMouseTracker();
