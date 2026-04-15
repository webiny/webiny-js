import { makeObservable, autorun, observable } from "mobx";
import type { GenericRecord } from "@webiny/app/types.js";
import { EditorHistory } from "./EditorHistory.js";
import { type IState, type MutableState, State } from "./State.js";
import { jsonPatch, type JsonPatchOperation } from "@webiny/website-builder-sdk";

export type StateChangeEvent<TState> = {
    reason: "undo" | "redo" | "update";
    diff: JsonPatchOperation[];
    state: TState;
};

export type StateChangeListener<T> = (event: StateChangeEvent<T>) => void;

export class StateWithHistory<TState extends GenericRecord = GenericRecord>
    implements IState<TState>
{
    private readonly history: EditorHistory;
    private state: State<TState>;
    private previousState: TState | undefined;
    private stateListeners: Array<(event: StateChangeEvent<TState>) => void> = [];
    private timeTravel = true;

    constructor(initialState: TState) {
        this.history = new EditorHistory({
            snapshots: [initialState],
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

            this.history.trackState(newState);

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
            return Object.assign({}, state, snapshot.getState());
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
            return Object.assign({}, state, snapshot.getState());
        });

        this.executeStateListeners({
            reason: "redo",
            diff: [],
            state: this.state.toJson()
        });
        this.timeTravel = true;
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
