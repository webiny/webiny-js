import React, { useEffect, useRef } from "react";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { useFeature } from "webiny/admin";
import { Toast, useToast } from "webiny/admin/ui";
import { WebLlmFeature } from "./feature.js";
import { MODEL_ID } from "./WebLlmService.js";

const ProgressDescription = observer(() => {
    const { service } = useFeature(WebLlmFeature);

    if (service.status === "loading") {
        return (
            <Toast.Description
                text={service.progress ? service.progress.text : "Initializing..."}
            />
        );
    }

    if (service.status === "ready") {
        return <Toast.Description text={`${MODEL_ID} is ready.`} />;
    }

    if (service.status === "error") {
        return <Toast.Description text={`Failed: ${service.error}`} />;
    }

    return <Toast.Description text={"Starting..."} />;
});

export const WebLlmAutoLoader = () => {
    console.log("[WebLLM] Autoloader");
    const { service } = useFeature(WebLlmFeature);
    const { showToast, hideToast } = useToast();
    const toastId = useRef<string | number | null>(null);

    useEffect(() => {
        service.loadModel();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const status = service.status;
            console.log("status", status);

            if (status === "loading" || status === "ready" || status === "error") {
                if (toastId.current === null) {
                    toastId.current = showToast({
                        title: "WebLLM",
                        description: <ProgressDescription />,
                        duration: Infinity,
                        dismissible: false
                    });
                }
            }

            if (status === "ready" || status === "error") {
                if (toastId.current !== null) {
                    const id = toastId.current;
                    setTimeout(() => hideToast(id), 4000);
                    toastId.current = null;
                }
            }
        });
    }, []);

    return null;
};
