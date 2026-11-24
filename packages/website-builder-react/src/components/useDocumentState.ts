import { toJS } from "mobx";
import { useDocumentStore } from "./DocumentStoreProvider.js";
import { useSelectFromState } from "./useSelectFromState.js";

export const useDocumentState = () => {
    const documentStore = useDocumentStore();
    return useSelectFromState(
        () => documentStore.getDocument()!,
        // The state's values (`toJS` reads them all), not the observable object: the store changes
        // values in place, so the object itself stays the same when a value changes.
        document => toJS(document.state) ?? {}
    );
};
