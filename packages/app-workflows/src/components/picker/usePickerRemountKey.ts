import { useState } from "react";
import type { PickerOption } from "./PickerOption.js";
import { toPickerChosenEntry } from "./toPickerChosenEntry.js";

/*
 * The admin-ui pickers keep its own chip list: it adds a chip for a new value, but never
 * removes a chip or updates a label when its props change. The key this hook returns changes when
 * a chosen item was removed or its label or warning changed, so the picker remounts and shows the
 * props again; a pure addition (the picker already added the chip itself) keeps the key.
 */
export const usePickerRemountKey = (chosen: PickerOption[]): number => {
    const entries = chosen.map(toPickerChosenEntry);
    const signature = entries.join(",");
    const [shown, setShown] = useState({ signature, entries, key: 0 });

    if (shown.signature !== signature) {
        const lost = shown.entries.some(entry => !entries.includes(entry));
        const key = lost ? shown.key + 1 : shown.key;
        setShown({ signature, entries, key });
        return key;
    }

    return shown.key;
};
