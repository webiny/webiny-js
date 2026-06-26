import { useFeature } from "@webiny/app";
import { ContentEntriesPresenterFeature } from "./feature.js";

export function useContentEntriesPresenter() {
    return useFeature(ContentEntriesPresenterFeature).presenter;
}
