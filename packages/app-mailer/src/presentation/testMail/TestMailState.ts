import { makeAutoObservable } from "mobx";
import { TestMailState as Abstraction } from "./abstractions.js";
import type { ITestMailResult } from "./abstractions.js";

class TestMailStateImpl implements Abstraction.Interface {
    sending = false;
    result: ITestMailResult | null = null;
    /*
     * Counts test runs. A test still in flight when `reset()` runs belongs to a screen that is
     * gone, so its result must not land on a test started after the screen was opened again.
     */
    private run = 0;

    constructor() {
        makeAutoObservable(this);
    }

    start(): number {
        this.sending = true;
        this.result = null;
        return ++this.run;
    }

    finish(run: number, result: ITestMailResult): void {
        if (run !== this.run) {
            return;
        }
        this.result = result;
        this.sending = false;
    }

    clearResult(): void {
        this.result = null;
    }

    reset(): void {
        this.run++;
        this.result = null;
        this.sending = false;
    }
}

export const TestMailState = Abstraction.createImplementation({
    implementation: TestMailStateImpl,
    dependencies: []
});
