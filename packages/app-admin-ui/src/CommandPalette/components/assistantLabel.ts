/**
 * "Webiny AI", plus the model once a run has named it. The model arrives fully qualified
 * ("anthropic/claude-sonnet-4-5"); the provider is dropped, since the model name already says it.
 */
export const assistantLabel = (model: string | undefined): string => {
    if (!model) {
        return "Webiny AI";
    }
    const name = model.slice(model.lastIndexOf("/") + 1);
    return `Webiny AI · ${name}`;
};
