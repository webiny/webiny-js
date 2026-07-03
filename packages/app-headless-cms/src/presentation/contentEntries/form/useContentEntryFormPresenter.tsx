import { useFeature } from "@webiny/app";
import { ContentEntryFormPresenterFeature } from "./feature.js";

export function useContentEntryFormPresenter() {
    return useFeature(ContentEntryFormPresenterFeature).presenter;
}
