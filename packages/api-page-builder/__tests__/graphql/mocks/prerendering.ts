import { PrerenderingPagePlugin } from "~/plugins/PrerenderingPagePlugin";

export type Markable = "render" | "flush";

export class PrerenderingPageMethodsPlugin extends PrerenderingPagePlugin {
    private readonly tracker: PrerenderingTracking;

    public constructor(tracker: PrerenderingTracking) {
        super();
        this.tracker = tracker;
    }
    public async render() {
        this.tracker.add("render");
    }

    public async flush() {
        this.tracker.add("flush");
    }
}

export class PrerenderingTracking {
    private readonly mark = new Map<Markable, number>();

    public reset(): void {
        this.mark.clear();
    }

    public getCount(name: Markable): number {
        return this.mark.get(name) || 0;
    }

    public add(name: Markable): void {
        const count = this.getCount(name);
        this.mark.set(name, count + 1);
    }
}
