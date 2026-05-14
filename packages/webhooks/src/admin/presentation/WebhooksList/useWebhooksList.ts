import { useFeature } from "@webiny/app";
import { WebhooksListFeature } from "./feature.js";

export function useWebhooksList() {
    return useFeature(WebhooksListFeature);
}
