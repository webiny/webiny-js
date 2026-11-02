// README 5: step types as people read them. A "review" step is a People step. Pure.
export const getStepTypeLabel = (type: string): string => {
    if (type === "ai") {
        return "AI";
    }
    if (type === "automation") {
        return "Automation";
    }
    return "People";
};
