type Grant = (granted: boolean) => void;

/**
 * Limits how many task iterations run at once. An iteration takes a slot before it runs and gives it
 * back after; one that finds them all taken waits in line, first come first served.
 */
export class IterationSlots {
    private readonly size: number;
    private used = 0;
    private readonly waiting: Grant[] = [];
    private closed = false;

    public constructor(size: number) {
        this.size = size;
    }

    /**
     * Resolves to `true` once a slot is this caller's, which it must hand back with `release`. Resolves
     * to `false` when the slots close first: the caller must not run.
     */
    public acquire(): Promise<boolean> {
        if (this.closed) {
            return Promise.resolve(false);
        }
        if (this.used < this.size) {
            this.used++;
            return Promise.resolve(true);
        }
        return new Promise<boolean>(resolve => {
            this.waiting.push(resolve);
        });
    }

    public release(): void {
        const next = this.waiting.shift();
        if (next) {
            // The slot passes straight to the next in line, so the count stays the same.
            next(true);
            return;
        }
        this.used--;
    }

    /** Turns away everyone still waiting, and anyone who asks from now on. */
    public close(): void {
        this.closed = true;
        const waiting = this.waiting.splice(0);
        for (const grant of waiting) {
            grant(false);
        }
    }

    public getRunning(): number {
        return this.used;
    }

    public getWaiting(): number {
        return this.waiting.length;
    }
}
