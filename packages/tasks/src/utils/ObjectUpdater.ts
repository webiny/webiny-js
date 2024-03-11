/**
 * We need to use the object-merge-advanced library to merge array items properly.
 * With plain assign or lodash merge, we will lose array items from the source object.
 */
import { defaults, mergeAdvanced } from "object-merge-advanced";

const mergeOptions: Partial<typeof defaults> = {
    hardArrayConcat: true
};

export class ObjectUpdater<T> {
    private data: Partial<T> = {};

    public merge(target: T, clear = true): T {
        const item = mergeAdvanced(target, this.data, mergeOptions);
        if (!clear) {
            return item;
        }
        this.clear();
        return item;
    }

    public fetch(clear = true): Partial<T> {
        const values = structuredClone(this.data);
        if (!clear) {
            return values;
        }
        this.clear();
        return values;
    }
    public update(input: Partial<T>) {
        this.data = mergeAdvanced(this.data, input, mergeOptions);
    }

    public isDirty(): boolean {
        return Object.keys(this.data).length > 0;
    }

    private clear() {
        this.data = {};
    }
}
