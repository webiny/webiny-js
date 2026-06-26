import { useFeature } from "@webiny/app";
import { PageListPresenterFeature } from "./feature.js";
import type { IPageListPresenter } from "./abstractions.js";

export function usePageListPresenter(): IPageListPresenter {
    return useFeature(PageListPresenterFeature).presenter;
}
