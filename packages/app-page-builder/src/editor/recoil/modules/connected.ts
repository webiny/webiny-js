import React from "react";
import {
    atom,
    AtomOptions,
    ReadOnlySelectorOptions,
    ReadWriteSelectorOptions,
    RecoilState,
    selector,
    SetterOrUpdater,
    useRecoilValue,
    useSetRecoilState
} from "recoil";
import { useBatching, useRedo, useUndo } from "recoil-undo";

type ConnectedStoreType = {
    setter: SetterOrUpdater<any> | null;
    value: any;
    state: RecoilState<any>;
};
type HelpersType = "startBatch" | "endBatch" | "undo" | "redo";

class ConnectedStore {
    private readonly _store: Map<string, ConnectedStoreType> = new Map();
    private readonly _helpers: Map<HelpersType, () => void> = new Map();

    public addRecoilState<T>(state: RecoilState<T>): RecoilState<T> {
        this._store.set(state.key, {
            state: state,
            setter: null,
            value: null
        });
        return state;
    }

    public updateRecoilState<T>(a: RecoilState<T>, newVal: T) {
        if (!this._store.has(a.key)) {
            throw new Error(
                "Attempting to update a connected value that was not created via connectedAtom."
            );
        }
        const cs = this._store.get(a.key);
        if (!cs.setter) {
            throw new Error(
                "Attempting to update a connected value, that has no setter attached yet. Using RecoilRootWithStore?"
            );
        }
        cs.setter(newVal);
    }

    public getRecoilState<T>(state: RecoilState<T>): T {
        if (!this._store.has(state.key)) {
            throw new Error(
                "Attempting to get a connected value that was not created via connectedAtom."
            );
        }
        const cs = this._store.get(state.key);
        if (cs.value === undefined) {
            throw new Error(
                "Attempting to get a connected value, that has no value attached yet. Using RecoilRootWithStore?"
            );
        }
        return cs.value;
    }

    public useInContext(context: any): void {
        const batching = useBatching;
        const setHook = useSetRecoilState;
        const getHook = useRecoilValue;
        const update = (store: ConnectedStoreType) => {
            store.setter = setHook(store.state);
        };
        const value = function(store: ConnectedStoreType) {
            store.value = getHook(store.state);
        };

        for (const store of this.getStoreValues()) {
            update.apply(context, [store]);
            value.apply(context, [store]);
        }

        this._helpers.clear();
        const { startBatch, endBatch } = batching.apply(context);
        const undoHook = useUndo.apply(context);
        const redoHook = useRedo.apply(context);
        this._helpers.set("startBatch", startBatch);
        this._helpers.set("endBatch", endBatch);
        this._helpers.set("undo", undoHook);
        this._helpers.set("redo", redoHook);
    }

    public startBatch(): void {
        this.runHelper("startBatch");
    }

    public endBatch(): void {
        this.runHelper("endBatch");
    }

    public undo(): void {
        this.runHelper("undo");
    }

    public redo(): void {
        this.runHelper("redo");
    }

    private runHelper(name: HelpersType): void {
        const helper = this._helpers.get(name);
        if (!helper) {
            throw new Error(`There is no helper "${name}".`);
        } else if (typeof helper !== "function") {
            throw new Error(
                `Helper "${name}" is not a function, its a type of "${typeof helper}".`
            );
        }
        helper();
    }

    private getStoreValues(): IterableIterator<ConnectedStoreType> {
        return this._store.values();
    }
}

export const connectedStore: ConnectedStore = new ConnectedStore();

export const ConnectedStoreComponent: React.FunctionComponent = () => {
    connectedStore.useInContext(this);
    return null;
};

export const connectedRecoilState = <T>(atom: RecoilState<T>): [T, SetterOrUpdater<T>] => {
    return [
        connectedAtomValue<T>(atom),
        (value: T) => {
            updateConnectedValue<T>(atom, value);
        }
    ];
};

export const updateConnectedValue = <T>(state: RecoilState<T>, val: T): void => {
    connectedStore.updateRecoilState(state, val);
};

export const connectedAtomValue = <T>(state: RecoilState<T>): T => {
    return connectedStore.getRecoilState<T>(state);
};

export const connectedAtom = <T>(options: AtomOptions<T>): RecoilState<T> => {
    return connectedStore.addRecoilState(atom<T>(options));
};

export const connectedReadSelector = <T>(options: ReadOnlySelectorOptions<T>): RecoilState<T> => {
    return connectedStore.addRecoilState(selector<T>(options) as RecoilState<T>);
};

export const connectedSelector = <T>(options: ReadWriteSelectorOptions<T>): RecoilState<T> => {
    return connectedStore.addRecoilState(selector<T>(options) as RecoilState<T>);
};

export const connectedBatchStart = (): void => {
    connectedStore.startBatch();
};

export const connectedBatchEnd = (): void => {
    connectedStore.endBatch();
};

export const connectedUndo = (): void => {
    connectedStore.undo();
};

export const connectedRedo = (): void => {
    connectedStore.redo();
};
