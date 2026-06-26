import { useFeature } from "@webiny/app";
import { ContentModelFormPreviewFeature } from "./feature.js";

export function useContentModelFormPreview() {
    return useFeature(ContentModelFormPreviewFeature).presenter;
}
