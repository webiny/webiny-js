import { RecoilState, useRecoilCallback, RecoilValueReadOnly, SetterOrUpdater } from "recoil";

export type ValueOrSetter<T> = SetterOrUpdater<T> | (T | ((prevValue: T) => T));

interface GetState {
    <T>(atom: RecoilState<T> | RecoilValueReadOnly<T>): T;
}

interface SetState {
    <T>(state: RecoilState<T>, valueOrSetter: ValueOrSetter<T>): void;
}

interface Portal {
    getState?: GetState;
    setState?: SetState;
}

const portal: Portal = {};

export default function RecoilExternal() {
    // @ts-ignore
    portal.getState = useRecoilCallback<[atom: RecoilState<any>], any>(
        ({ snapshot }) =>
            function <T>(atom: RecoilState<T>) {
                return snapshot.getLoadable(atom).contents;
            },
        []
    );

    // @ts-ignore
    portal.setState = useRecoilCallback(({ set }) => set, []);

    return null;
}

export const getState: GetState = atom => {
    return portal.getState!(atom);
};

export const setState: SetState = (atom, valueOrSetter) => {
    portal.setState!(atom, valueOrSetter);
};
