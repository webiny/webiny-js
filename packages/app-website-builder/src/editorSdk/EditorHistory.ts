import pick from "lodash/pick";
import { jsonPatch } from "~/sdk/jsonPatch";
import { HistorySnapshot, type SnapshotState } from "./HistorySnapshot.js";

interface EditorHistoryParams {
    snapshots?: SnapshotState[];
    observeKeys?: string[];
}

export class EditorHistory {
    private snapshots: HistorySnapshot[];
    private activeSnapshotIndex: number;
    private readonly observeKeys: string[];

    constructor(params?: EditorHistoryParams) {
        this.observeKeys = params?.observeKeys ?? [];
        this.snapshots = (params?.snapshots ?? []).map(state => {
            const snapshotData = this.getValuesOfInterest(state);
            return new HistorySnapshot(snapshotData);
        });
        this.activeSnapshotIndex = this.snapshots.length - 1;
    }

    getSnapshots() {
        return this.snapshots;
    }

    trackState(snapshot: SnapshotState) {
        const newSnapshotState = this.getValuesOfInterest(snapshot);
        const currentSnapshot = this.snapshots[this.activeSnapshotIndex];

        const changes = jsonPatch.compare(currentSnapshot.getState(), newSnapshotState);
        if (changes.length === 0) {
            return;
        }

        const newSnapshot = new HistorySnapshot(newSnapshotState, changes);

        // Values of interest have changed! Create a snapshot.
        this.snapshots = [...this.snapshots.slice(0, this.activeSnapshotIndex + 1), newSnapshot];
        this.activeSnapshotIndex = this.snapshots.length - 1;
    }

    getCurrentSnapshot() {
        return this.snapshots[this.activeSnapshotIndex];
    }

    getActiveSnapshotIndex() {
        return this.activeSnapshotIndex;
    }

    goToOlderSnapshot() {
        if (this.activeSnapshotIndex <= 0) {
            return this.snapshots[this.activeSnapshotIndex];
        }

        this.activeSnapshotIndex -= 1;

        return this.snapshots[this.activeSnapshotIndex];
    }

    goToNewerSnapshot() {
        if (this.activeSnapshotIndex >= this.snapshots.length - 1) {
            return this.snapshots[this.activeSnapshotIndex];
        }

        this.activeSnapshotIndex += 1;
        return this.snapshots[this.activeSnapshotIndex];
    }

    private getValuesOfInterest(state: SnapshotState) {
        return this.observeKeys.length > 0 ? pick(state, this.observeKeys) : state;
    }
}
