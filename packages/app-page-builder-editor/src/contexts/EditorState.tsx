// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useRef } from "react";
import { PbEditorElement } from "~/types";
import {
    Snapshot,
    useGotoRecoilSnapshot,
    useRecoilCallback,
    useRecoilSnapshot,
    useSetRecoilState
} from "recoil";
import {
    activeElementAtom,
    highlightElementAtom,
    elementsAtom,
    pageAtom,
    sidebarAtom,
    uiAtom
} from "~/state";
import { usePbEditor } from "~/hooks/usePbEditor";
// import { ApplyStateChangesActionEvent } from "../app/ApplyStateChangesActionEvent";
import { PbState } from "~/state/types";
// import { UndoStateChangeActionEvent } from "../actions/undo";
// import { RedoStateChangeActionEvent } from "~/actions/redo";
// import { SaveRevisionActionEvent } from "~/actions";

interface SnapshotHistory {
    past: Snapshot[];
    future: Snapshot[];
    busy: boolean;
    present: Snapshot | null;
    isBatching: boolean;
    isDisabled: boolean;
}

const trackedAtoms = ["elements"];

const isTrackedAtomChanged = (state: Partial<PbState>): boolean => {
    for (const atom of trackedAtoms) {
        if (!state[atom]) {
            continue;
        }
        return true;
    }
    return false;
};

export const EditorState: React.FunctionComponent<any> = () => {
    const { editor } = usePbEditor();
    const setActiveElementId = useSetRecoilState(activeElementAtom);
    const setHighlightElementId = useSetRecoilState(highlightElementAtom);
    const setSidebarAtomValue = useSetRecoilState(sidebarAtom);
    const setPageAtomValue = useSetRecoilState(pageAtom);
    // const setPluginsAtomValue = useSetRecoilState(pluginsAtom);
    const setUiAtomValue = useSetRecoilState(uiAtom);
    const goToSnapshot = useGotoRecoilSnapshot();
    const currentSnapshot = useRecoilSnapshot();

    const snapshotsHistory = useRef<SnapshotHistory>({
        past: [],
        future: [],
        present: currentSnapshot,
        busy: false,
        isBatching: false,
        isDisabled: false
    });

    const takeSnapshot = useRecoilCallback(({ snapshot }) => () => {
        // return snapshot.map(snap => {
        //     We want to reset the `pluginsAtom` to avoid UI state being tracked in history.
        // snap.set(pluginsAtom, currentSnapshot.getLoadable(pluginsAtom).contents);
        // });
    });

    const createStateHistorySnapshot = (): void => {
        if (snapshotsHistory.current.busy === true) {
            return;
        }
        snapshotsHistory.current.busy = true;
        // when saving new state history we must remove everything after the current one
        // since this is the new starting point of the state history
        snapshotsHistory.current.future = [];
        snapshotsHistory.current.past.push(takeSnapshot());
        snapshotsHistory.current.present = currentSnapshot;
        snapshotsHistory.current.busy = false;
    };

    const updateElements = useRecoilCallback(({ set }) => (elements: PbEditorElement[] = []) => {
        elements.forEach(item => {
            set(elementsAtom(item.id), prevValue => {
                return {
                    ...prevValue,
                    ...item,
                    parent: item.parent !== undefined ? item.parent : prevValue.parent
                };
            });
            return item.id;
        });
    });

    useEffect(() => {
        snapshotsHistory.current.present = currentSnapshot;
    }, [currentSnapshot]);

    useEffect(() => {
        // app.addEventListener(ApplyStateChangesActionEvent, event => {
        //     const { state } = event.getData();
        //
        //     if (Object.values(state).length === 0) {
        //         return;
        //     } else if (
        //         snapshotsHistory.current.isBatching === false &&
        //         snapshotsHistory.current.isDisabled === false &&
        //         isTrackedAtomChanged(state)
        //     ) {
        //         createStateHistorySnapshot();
        //     }
        //
        //     if (state.ui) {
        //         setUiAtomValue(prev => ({ ...prev, ...state.ui }));
        //     }
        //
        //     if (state.plugins) {
        //         setPluginsAtomValue(state.plugins);
        //     }
        //
        //     if (state.page) {
        //         setPageAtomValue(prev => ({ ...prev, ...state.page }));
        //     }
        //
        //     if (state.hasOwnProperty("activeElement")) {
        //         setActiveElementId(state.activeElement);
        //     }
        //
        //     if (state.hasOwnProperty("highlightElement")) {
        //         setHighlightElementId(state.highlightElement);
        //     }
        //
        //     if (state.elements) {
        //         updateElements(Object.values(state.elements));
        //     }
        //
        //     if (state.sidebar) {
        //         setSidebarAtomValue(state.sidebar);
        //     }
        // });
        // app.addEventListener(UndoStateChangeActionEvent, () => {
        //     if (snapshotsHistory.current.busy === true) {
        //         return;
        //     }
        //     snapshotsHistory.current.busy = true;
        //     const previousSnapshot = snapshotsHistory.current.past.pop();
        //     if (!previousSnapshot) {
        //         snapshotsHistory.current.busy = false;
        //         return;
        //     }
        //     const futureSnapshot = snapshotsHistory.current.present || currentSnapshot;
        //     snapshotsHistory.current.future.unshift(futureSnapshot);
        //
        //     snapshotsHistory.current.present = previousSnapshot;
        //
        //     goToSnapshot(previousSnapshot);
        //     snapshotsHistory.current.busy = false;
        //
        //     app.dispatchEvent(new SaveRevisionActionEvent());
        // });
        // app.addEventListener(RedoStateChangeActionEvent, () => {
        //     if (snapshotsHistory.current.busy === true) {
        //         return;
        //     }
        //     snapshotsHistory.current.busy = true;
        //     const nextSnapshot = snapshotsHistory.current.future.shift();
        //     if (!nextSnapshot) {
        //         snapshotsHistory.current.busy = false;
        //         return;
        //     } else if (snapshotsHistory.current.present) {
        //         snapshotsHistory.current.past.push(snapshotsHistory.current.present);
        //     }
        //     snapshotsHistory.current.present = nextSnapshot;
        //
        //     goToSnapshot(nextSnapshot);
        //     snapshotsHistory.current.busy = false;
        //     app.dispatchEvent(new SaveRevisionActionEvent());
        // });
    }, []);

    return null;
};
