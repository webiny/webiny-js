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
    const selected = new Set([...state.selected]);
    const selection = { ...state.selection };

    // Add a single file to selection.
    if (existingIndex === undefined && !shiftKeyPressed) {
        selected.add(toggledFile);
        selection.anchor = toggledFileIndex;
        selection.focus = undefined;
    }

    // Remove a single file from selection.
    if (existingIndex !== undefined && !shiftKeyPressed) {
        selected.delete(toggledFile);
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

            if (
                index !== undefined &&
                oldFocus &&
                newFocus &&
                newFocus < oldFocus &&
                index > newFocus &&
                index <= oldFocus
            ) {
                selected.delete(file);
            }

            // @ts-ignore
            if(selection.anchor > oldAnchor && index >= oldAnchor && index < oldFocus) {
                selected.delete(file);
            }
        });

        selectedRange.forEach(file => {
            selected.add(file);
        });
    }

    return {
        ...state,
        selection,
        selected: Array.from(selected.values())
    };
};
