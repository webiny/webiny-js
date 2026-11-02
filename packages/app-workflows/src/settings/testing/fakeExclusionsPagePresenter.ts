import { vi } from "vitest";
import type { Mock } from "vitest";
import { observable } from "mobx";
import { runInAction } from "mobx";
import type { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import type { ExclusionsPageVm } from "~/settings/presentation/exclusionsPage/abstractions.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { createExclusionsPageViewModel } from "./createExclusionsPageViewModel.js";

type PagePresenter = ExclusionsPagePresenter.Interface;

export interface FakeExclusionsPagePresenter extends PagePresenter {
    init: Mock<PagePresenter["init"]>;
    reload: Mock<PagePresenter["reload"]>;
    retryNames: Mock<PagePresenter["retryNames"]>;
    setTab: Mock<PagePresenter["setTab"]>;
    setUserFilter: Mock<PagePresenter["setUserFilter"]>;
    searchUserFilter: Mock<PagePresenter["searchUserFilter"]>;
    openAdd: Mock<PagePresenter["openAdd"]>;
    openEdit: Mock<PagePresenter["openEdit"]>;
    openRemove: Mock<ExclusionsSource["openRemove"]>;
    closeDialog: Mock<ExclusionsSource["closeDialog"]>;
    dispose: Mock<PagePresenter["dispose"]>;
    getExclusions: Mock<ExclusionsSource["getExclusions"]>;
    getTimeZone: Mock<ExclusionsSource["getTimeZone"]>;
    getUserName: Mock<ExclusionsSource["getUserName"]>;
    applySaved: Mock<ExclusionsSource["applySaved"]>;
    // Replaces the view model; reactive components re-render.
    setVm(vm: ExclusionsPageVm): void;
}

// A page presenter that records every command and renders the given view model.
export const createFakeExclusionsPagePresenter = (
    vm: ExclusionsPageVm = createExclusionsPageViewModel()
): FakeExclusionsPagePresenter => {
    const state = observable.box(vm, { deep: false });

    const setVm = (next: ExclusionsPageVm): void => {
        runInAction(() => {
            state.set(next);
        });
    };

    return {
        get vm() {
            return state.get();
        },
        setVm,
        init: vi.fn(),
        reload: vi.fn(),
        retryNames: vi.fn(),
        setTab: vi.fn(),
        setUserFilter: vi.fn(),
        searchUserFilter: vi.fn(),
        openAdd: vi.fn(),
        openEdit: vi.fn(),
        openRemove: vi.fn(),
        closeDialog: vi.fn(),
        dispose: vi.fn(),
        getExclusions: vi.fn(),
        getTimeZone: vi.fn(),
        getUserName: vi.fn(),
        applySaved: vi.fn()
    };
};
