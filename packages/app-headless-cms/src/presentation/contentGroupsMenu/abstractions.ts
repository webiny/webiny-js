import { createAbstraction } from "@webiny/feature/admin";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";

export interface IContentGroupsMenuPresenterViewModel {
    loading: boolean;
    groups: ModelGroupDto[];
}

export interface IContentGroupsMenuPresenter {
    readonly vm: IContentGroupsMenuPresenterViewModel;
    init(): Promise<void>;
}

export const ContentGroupsMenuPresenter = createAbstraction<IContentGroupsMenuPresenter>(
    "CmsContentGroupsMenu/Presenter"
);

export namespace ContentGroupsMenuPresenter {
    export type Interface = IContentGroupsMenuPresenter;
    export type ViewModel = IContentGroupsMenuPresenterViewModel;
}
