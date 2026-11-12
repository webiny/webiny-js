type Grant = (granted: boolean) => void;

/**
 * Limits how many pieces of work run at once. Work takes a slot before it runs and gives it back
 * after; work that finds them all taken waits in line, first come first served.
 */
export class ConcurrencySlots {
    private readonly size: number;
    private used = 0;
    private readonly waiting: Grant[] = [];
    private closed = false;

    public constructor(size: number) {
        if (!Number.isInteger(size) || size < 1) {
            throw new Error(
                `ConcurrencySlots needs a positive whole number of slots, got ${size}.`
            );
        }
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

    /**
     * Takes callers again after `close`. Slots still held from before stay counted, so the limit
     * holds across a close and reopen.
     */
    public open(): void {
        this.closed = false;
    }

    public getRunning(): number {
        return this.used;
    }

    public getWaiting(): number {
        return this.waiting.length;
    }
}
