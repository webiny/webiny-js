import { useState, useEffect } from "react";
import { autorun } from "mobx";
import { useFeature } from "webiny/admin";
import { WebLlmFeature } from "./feature.js";
import type { IWebLlmService } from "./abstractions.js";

interface WebLlmSnapshot {
    service: IWebLlmService;
    status: IWebLlmService["status"];
    engine: IWebLlmService["engine"];
    progress: IWebLlmService["progress"];
    error: IWebLlmService["error"];
}

export function useWebLlm(): WebLlmSnapshot {
    const { service } = useFeature(WebLlmFeature);

    const [snapshot, setSnapshot] = useState<WebLlmSnapshot>(() => ({
        service,
        status: service.status,
        engine: service.engine,
        progress: service.progress,
        error: service.error
    }));

    useEffect(() => {
        return autorun(() => {
            setSnapshot({
                service,
                status: service.status,
                engine: service.engine,
                progress: service.progress,
                error: service.error
            });
        });
    }, [service]);

    return snapshot;
}
