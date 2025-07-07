import { useDocumentStore } from "./DocumentStoreProvider";
import { useSelectFromState } from "./useSelectFromState";

export const useDocumentState = () => {
    const documentStore = useDocumentStore();
    return useSelectFromState(
        () => documentStore.getDocument()!,
        document => document.state ?? {}
    );
};
