import type { JsonPatchOperation } from "~/sdk/jsonPatch";

export type SnapshotState = Record<string, any>;

export class HistorySnapshot<T = SnapshotState> {
    private readonly state: T;
    private readonly createdOn: Date;
    private readonly changes: any;

    constructor(state: T, changes: JsonPatchOperation[] = []) {
        this.changes = changes;
        this.state = state;
        this.createdOn = new Date();
    }

    getState() {
        return this.state;
    }

    getCreatedOn() {
        return this.createdOn;
    }

    getChanges() {
        return this.changes;
    }
}
