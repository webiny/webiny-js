export const useCurrentApp = () => {
    return new URLSearchParams(location.search).get("app");
};

export const useCurrentWorkflowId = () => {
    return new URLSearchParams(location.search).get("id");
};
