import { FileItem } from "@webiny/app-admin/types";
import { State } from "./state";

interface GetSelectionParams {
    state: State;
    files: FileItem[];
    toggledFile: FileItem;
    shiftKeyPressed: boolean;
}

const getFileIndex = (files: FileItem[], file: FileItem | undefined) => {
    if (!file) {
        return undefined;
    }

    const index = files.findIndex(f => f.id === file.id);
    return index > -1 ? index : undefined;
};

const isAnchorSet = (anchor: number | undefined): anchor is number => {
    return anchor !== undefined;
};

const normalizeSelection = (
    start: number,
    end: number | undefined
): [number, number | undefined] => {
    if (end === undefined) {
        return [start, undefined];
    }

    return [Math.min(start, end), Math.max(start, end)];
};

export const setSelection = ({
    state,
    files,
    toggledFile,
    shiftKeyPressed
}: GetSelectionParams) => {
    // Check if the `toggledFile` is already in the `selected` files.
    const existingIndex = getFileIndex(state.selected, toggledFile);
    const toggledFileIndex = getFileIndex(files, toggledFile) as number;
    const selected = new Map(state.selected.map(item => [item.id, item]));
    const selection = { ...state.selection };

    // Add a single file to selection.
    if (existingIndex === undefined && !shiftKeyPressed) {
        selected.set(toggledFile.id, toggledFile);
        selection.anchor = toggledFileIndex;
        selection.focus = undefined;
    }

    // Remove a single file from selection.
    if (existingIndex !== undefined && !shiftKeyPressed) {
        selected.delete(toggledFile.id);
        const prevSelectedFile = Array.from(selected.values()).pop();
        selection.anchor = getFileIndex(files, prevSelectedFile);
        selection.focus = undefined;
    }

    // Handle range selection ("shift" key is pressed).
    if (isAnchorSet(selection.anchor) && shiftKeyPressed) {
        const prevFocus = selection.focus;
        selection.focus = toggledFileIndex;

        const [newAnchor, newFocus] = normalizeSelection(selection.anchor, toggledFileIndex);
        const [oldAnchor, oldFocus] = normalizeSelection(selection.anchor, prevFocus);

        const selectedRange = files.filter((_, index) => {
            if (index < newAnchor) {
                return false;
            }

            if (newFocus && index > newFocus) {
                return false;
            }

            return true;
        });

        selected.forEach(file => {
            const index = getFileIndex(files, file);
            const selectionAnchor = selection.anchor;

            const mustNotBeUndefined = [index, oldFocus, newFocus, selectionAnchor];
            if (mustNotBeUndefined.includes(undefined)) {
                return;
            }

            /**
             * If the new selection is smaller than the previous selection, we need to deselect items
             * that are now outside the new, smaller, selection.
             */
            // @ts-expect-error We already checked for `undefined` above.
            if (newFocus < oldFocus && index > newFocus && index <= oldFocus) {
                selected.delete(file.id);
            }

            /**
             * If the previous selection was made backwards (`oldAnchor` is essentially pointing to the shift-clicked item
             * of the previous selection, which is the `focus` of the selection, but it's normalized, so it becomes an anchor),
             * and the current selection is made forward (selectionAnchor > oldAnchor), we need to deselect items between the
             * old selection anchor and the old selection focus (which is also the new selection anchor).
             */
            // @ts-expect-error We already checked for `undefined` above.
            if (selectionAnchor > oldAnchor && index >= oldAnchor && index < oldFocus) {
                selected.delete(file.id);
            }
        });

        selectedRange.forEach(file => {
            selected.set(file.id, file);
        });
    }

    return {
        ...state,
        selection,
        selected: Array.from(selected.values())
    };
};
