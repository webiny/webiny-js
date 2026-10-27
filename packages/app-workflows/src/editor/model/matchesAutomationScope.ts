const WILDCARD_SUFFIX = ".*";

const coversModel = (automationModel: string, workflowModel: string): boolean => {
    if (automationModel === "*") {
        return true;
    }
    if (
        automationModel.endsWith(WILDCARD_SUFFIX) &&
        automationModel.length > WILDCARD_SUFFIX.length
    ) {
        // "cms.*" covers "cms.article": the namespace prefix up to and including the dot.
        const prefix = automationModel.slice(0, -1);
        return workflowModel.startsWith(prefix) && workflowModel.length > prefix.length;
    }
    return automationModel === workflowModel;
};

/*
 * Whether an automation's `models` cover every model of a workflow (D35, R269): `"*"` covers all,
 * `"<app>.*"` the namespace ids starting with `"<app>."`, anything else is an exact namespace id. A
 * client mirror of `matchesAutomationScope` in `api-workflows` (`domain/automation/`), so the editor
 * never offers an automation the server would refuse to save.
 */
export const matchesAutomationScope = (
    automationModels: string[],
    workflowModels: string[]
): boolean => {
    if (workflowModels.length === 0) {
        return false;
    }
    return workflowModels.every(workflowModel => {
        return automationModels.some(automationModel => {
            return coversModel(automationModel, workflowModel);
        });
    });
};
