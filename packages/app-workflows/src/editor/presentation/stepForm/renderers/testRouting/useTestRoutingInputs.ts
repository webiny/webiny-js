import { useState } from "react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { toFolderPickerOption } from "../../toFolderPickerOption.js";
import { toUserPickerOption } from "../../toUserPickerOption.js";
import { useStepFormOptions } from "../../useStepFormOptions.js";
import { filterPickerOptions } from "../../filterPickerOptions.js";
import type { TestRoutingInputsProps } from "./TestRoutingInputs.js";

/*
 * Turns the `users`, `folders` and `testRouting` slices into the props of the two inputs (R315).
 * Users are searched on the server through `users.searchUsers`; the folder list is complete, so
 * its search is a client-side filter over it (R292). Two trivial visual states: the folder search
 * text, and the option just picked as requester, which keeps its label when the next search no
 * longer lists the person.
 */
export const useTestRoutingInputs = (): TestRoutingInputsProps => {
    const { users, folders, testRouting } = useStepFormOptions();
    const [picked, setPicked] = useState<PickerOption | null>(null);
    const [folderQuery, setFolderQuery] = useState("");

    const requesterOptions = users.items.map(user => toUserPickerOption(user));
    const heldOptions = users.selected.map(user => toUserPickerOption(user));
    const requesterId = testRouting.vm.requesterId;
    let requesterSelected: PickerOption | null = null;
    if (requesterId !== null) {
        const known = [...requesterOptions, ...heldOptions];
        requesterSelected = known.find(option => option.id === requesterId) ?? null;
        if (requesterSelected === null && picked !== null && picked.id === requesterId) {
            requesterSelected = picked;
        }
    }

    const allFolders = folders.items.map(folder => toFolderPickerOption(folder));
    const folderOptions = filterPickerOptions(allFolders, folderQuery);
    const folderId = testRouting.vm.folderId;
    let folderSelected: PickerOption | null = null;
    if (folderId !== null) {
        folderSelected = allFolders.find(option => option.id === folderId) ?? null;
    }

    const handleRequester = (id: string | null): void => {
        const chosen = requesterOptions.find(option => option.id === id) ?? null;
        setPicked(chosen);
        testRouting.setTestRequester(id);
    };

    const handleFolder = (id: string | null): void => {
        setFolderQuery("");
        testRouting.setTestFolder(id);
    };

    return {
        requester: {
            value: requesterId,
            selected: requesterSelected,
            options: requesterOptions,
            failed: users.failed,
            retry: users.retry,
            onSearch: query => users.searchUsers(query),
            onChange: handleRequester
        },
        folder: {
            value: folderId,
            selected: folderSelected,
            options: folderOptions,
            failed: folders.failed,
            retry: folders.retry,
            onSearch: query => setFolderQuery(query),
            onChange: handleFolder
        }
    };
};
