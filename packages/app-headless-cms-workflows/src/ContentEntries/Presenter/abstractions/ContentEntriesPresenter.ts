import type { IWorkflowState } from "@webiny/app-workflows/types.js";
import type { ICmsEntryRevisionSimple, IGenericError } from "../../types.js";

export interface IContentEntriesPresenterViewModel {
    error: IGenericError | null;
    loading: boolean;
    states: IWorkflowState[];
    items: ICmsEntryRevisionSimple[];
    getFolderId(state: IWorkflowState): string | undefined;
}

export interface IContentEntriesPresenter {
    vm: IContentEntriesPresenterViewModel;
    addItems(items: IWorkflowState[]): Promise<void>;
}
