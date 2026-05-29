import { useEffect } from "react";
import { autorun } from "mobx";
import { toast } from "sonner";
import { useFeature } from "webiny/admin";
import { WebLlmFeature } from "./feature.js";
import { MODEL_ID } from "./WebLlmService.js";

const TOAST_ID = "webllm-progress";

export const WebLlmAutoLoader = () => {
    const { service } = useFeature(WebLlmFeature);

    useEffect(() => {
        service.loadModel();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const { status, progress, error } = service;

            if (status === "loading") {
                const text = progress ? progress.text : "Initializing...";
                toast.loading(text, { id: TOAST_ID, duration: Infinity });
            }

            if (status === "ready") {
                toast.success(`${MODEL_ID} is ready.`, { id: TOAST_ID, duration: 4000 });
            }

            if (status === "error") {
                toast.error(`Failed: ${error}`, { id: TOAST_ID, duration: 8000 });
            }
        });
    }, []);

    return null;
};
