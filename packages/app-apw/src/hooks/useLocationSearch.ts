import { ApwWorkflowApplications } from "~/types";

export const useCurrentApp = (): ApwWorkflowApplications => {
    let app = new URLSearchParams(location.search).get("app");
    if (!app) {
        app = ApwWorkflowApplications.PB;
    }
    return app as ApwWorkflowApplications;
};

export const useCurrentWorkflowId = () => {
    return new URLSearchParams(location.search).get("id");
};
