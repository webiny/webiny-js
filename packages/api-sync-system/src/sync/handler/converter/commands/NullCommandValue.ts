import type { ICommandValue } from "~/sync/types.js";

export class NullCommandValue implements ICommandValue {
    /**
     * Does not matter what will be here, we will not use it.
     */
    public readonly command = "null";

    public getItems(): null {
        return null;
    }
}
