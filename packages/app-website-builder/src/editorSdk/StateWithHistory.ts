import { makeObservable, autorun, observable } from "mobx";
import type { GenericRecord } from "@webiny/app/types.js";
import { EditorHistory } from "./EditorHistory.js";
import { type IState, type MutableState, State } from "./State.js";
import {
    type GlobalDocument,
    GlobalElementId,
    jsonPatch,
    type JsonPatchOperation
} from "@webiny/website-builder-sdk";

/**
 * The instances of global components (`$global:{name}` and everything inside them) are saved on their own,
 * not with the document, so they are kept out of the history: undo and redo never change them. Their
 * placements are elements of the document like any other, so placing, moving and removing a global can be
 * undone.
 */
const withoutGlobals = (state: GenericRecord) => {
    if (!state.elements) {
        return state;
    }

    const { page } = GlobalElementId.splitDocument(state as GlobalDocument);
    return { ...state, elements: page.elements, bindings: page.bindings };
};

export type StateChangeEvent<TState> = {
    reason: "undo" | "redo" | "update";
    diff: JsonPatchOperation[];
    state: TState;
};

export type StateChangeListener<T> = (event: StateChangeEvent<T>) => void;

export class StateWithHistory<
    TState extends GenericRecord = GenericRecord
> implements IState<TState> {
    private readonly history: EditorHistory;
    private state: State<TState>;
    private previousState: TState | undefined;
    private stateListeners: Array<(event: StateChangeEvent<TState>) => void> = [];
    private timeTravel = true;

    constructor(initialState: TState) {
        this.history = new EditorHistory({
            snapshots: [withoutGlobals(initialState)],
            observeKeys: ["elements", "bindings"]
        });

        this.state = new State<TState>(initialState);

        makeObservable<StateWithHistory, "state">(this, {
            state: observable
        });

        const handleStateUpdate = (newState: any) => {
            if (!this.timeTravel) {
                return;
            }

            const previousState = this.previousState ?? {};
            const diff = jsonPatch.compare(previousState, newState);
            this.previousState = undefined;

            this.history.trackState(withoutGlobals(newState));

            if (diff.length) {
                this.executeStateListeners({
                    reason: "update",
                    diff,
                    state: newState
                });
            }
        };

        autorun(() => {
            const newState = this.state.toJson();
            handleStateUpdate(newState);
        });
    }

    read(): TState {
        return this.state.read();
    }

    toJson() {
        return this.state.toJson();
    }

    setState(setter: (state: MutableState<TState>) => TState) {
        this.state.setState(setter);
    }

    update(cb: (state: MutableState<TState>) => void): void {
        // This is necessary to calculate a diff between two states later on.
        if (!this.previousState) {
            this.previousState = structuredClone(this.state.toJson());
        }
        this.state.update(cb);
    }

    getHistory() {
        return this.history;
    }

    undo() {
        this.timeTravel = false;
        const snapshot = this.history.goToOlderSnapshot();

        this.state.setState(state => {
            return Object.assign({}, state, this.withCurrentGlobals(snapshot.getState()));
        });

        this.executeStateListeners({
            reason: "undo",
            diff: [],
            state: this.state.toJson()
        });
        this.timeTravel = true;
    }

    redo() {
        this.timeTravel = false;
        const snapshot = this.history.goToNewerSnapshot();
        this.state.setState(state => {
            return Object.assign({}, state, this.withCurrentGlobals(snapshot.getState()));
        });

        this.executeStateListeners({
            reason: "redo",
            diff: [],
            state: this.state.toJson()
        });
        this.timeTravel = true;
    }

    // A restored snapshot has no global instances: they're kept as they are now.
    private withCurrentGlobals(snapshotState: GenericRecord) {
        const current = this.state.toJson() as unknown as GlobalDocument;
        if (!current.elements) {
            return snapshotState;
        }

        const snapshot = snapshotState as GlobalDocument;
        const { globals } = GlobalElementId.splitDocument(current);

        return {
            ...snapshotState,
            elements: { ...snapshot.elements, ...globals.elements },
            bindings: { ...snapshot.bindings, ...globals.bindings }
        };
    }

    onStateChange(listener: StateChangeListener<TState>): () => void {
        this.stateListeners.push(listener);
        return () => {
            this.stateListeners = this.stateListeners.filter(l => l !== listener);
        };
    }

    private executeStateListeners(event: StateChangeEvent<TState>) {
        this.stateListeners.forEach(listener => {
            listener(event);
        });
    }
}
