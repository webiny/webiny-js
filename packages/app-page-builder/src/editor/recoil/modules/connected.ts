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

type ConnectedStoreHelpersType = {
    startBatch: () => void;
    endBatch: () => void;
    undo: () => void;
    redo: () => void;
};

class ConnectedStore {
    private readonly _store: Map<string, ConnectedStoreType> = new Map();
    private _helpers: ConnectedStoreHelpersType;

    public addRecoilState<T>(rs: RecoilState<T>): RecoilState<T> {
        this._store.set(rs.key, {
            state: rs,
            setter: null,
            value: null
        });
        return rs;
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
        if (!cs.value) {
            throw new Error(
                "Attempting to get a connected value, that has no value attached yet. Using RecoilRootWithStore?"
            );
        }
        return cs.value;
    }

    public useInContext(context: any): void {
        const batching = useBatching;
        const hook = useSetRecoilState;
        const getHook = useRecoilValue;
        const update = (store: ConnectedStoreType) => {
            store.setter = hook(store.state);
        };
        const value = function(store: ConnectedStoreType) {
            store.value = getHook(store.state);
        };

        for (const store of this._store.values()) {
            update.apply(context, [store]);
            value.apply(context, [store]);
        }

        const { startBatch, endBatch } = batching.apply(context);

        this._helpers = {
            startBatch,
            endBatch,
            undo: useUndo.apply(context),
            redo: useRedo.apply(context)
        };
    }

    public startBatch(): void {
        this._helpers.startBatch();
    }

    public endBatch(): void {
        this._helpers.endBatch();
    }

    public undo(): void {
        this._helpers.undo();
    }

    public redo(): void {
        this._helpers.redo();
    }
}

export const connectedStore: ConnectedStore = new ConnectedStore();

let hadFirstRun = false;
export const ConnectedStoreComponent: React.FunctionComponent = () => {
    if (hadFirstRun) {
        return null;
    }
    connectedStore.useInContext(this);
    hadFirstRun = true;
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

export function updateConnectedValue<T>(state: RecoilState<T>, val: T): void {
    connectedStore.updateRecoilState(state, val);
}

export function connectedAtomValue<T>(state: RecoilState<T>): T {
    return connectedStore.getRecoilState<T>(state);
}

export function connectedAtom<T>(options: AtomOptions<T>): RecoilState<T> {
    return connectedStore.addRecoilState(atom<T>(options));
}

export function connectedReadSelector<T>(options: ReadOnlySelectorOptions<T>): RecoilState<T> {
    return connectedStore.addRecoilState(selector<T>(options) as RecoilState<T>);
}

export function connectedSelector<T>(options: ReadWriteSelectorOptions<T>): RecoilState<T> {
    return connectedStore.addRecoilState(selector<T>(options) as RecoilState<T>);
}

export function connectedBatchStart(): void {
    connectedStore.startBatch();
}

export function connectedBatchEnd(): void {
    connectedStore.endBatch();
}

export function connectedUndo(): void {
    connectedStore.undo();
}

export function connectedRedo(): void {
    connectedStore.redo();
}
