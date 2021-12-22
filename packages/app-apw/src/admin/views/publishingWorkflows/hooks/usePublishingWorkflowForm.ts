import { useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { useRouter } from "@webiny/react-router";

export const usePublishingWorkflowForm = () => {
    const { location, history } = useRouter();
    const newEntry = new URLSearchParams(location.search).get("new") === "true";

    const loading = false;

    const onSubmit = useCallback(async data => {
        console.log(data);
    }, []);

    const workflow = {};

    const showEmptyView = !newEntry && !loading && isEmpty(workflow);
    const baseUrl = "/apw/publishing-workflows";
    const createPublishingWorkflow = useCallback(() => history.push(baseUrl + "?new=true"), []);
    const cancelEditing = useCallback(() => history.push(baseUrl), []);

    return {
        loading,
        showEmptyView,
        createPublishingWorkflow,
        cancelEditing,
        onSubmit
    };
};
