import { useState, useEffect } from "react";
import { autorun } from "mobx";
import type { ILicense } from "@webiny/wcp/types";
import { useFeature } from "@webiny/app";
import { WcpFeature } from "~/features/wcp/feature.js";

export function useWcp() {
    const { service } = useFeature(WcpFeature);

    const [project, setProject] = useState<ILicense>(() => service.getProject());

    useEffect(() => {
        return autorun(() => {
            setProject(service.getProject());
        });
    }, [service]);

    return project;
}
