import { useFeature } from "@webiny/app";
import { LivePreviewFeature } from "./feature.js";

export function useLivePreviewPresenter() {
    return useFeature(LivePreviewFeature).presenter;
}
