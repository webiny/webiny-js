/** The composer's placeholder, and the palette's, while no model is set. */
export const NO_MODEL_PLACEHOLDER = "Unavailable until a model is set";

/**
 * "AI assistant", plus the model once a run has named it, or "no model set" while the project has
 * none. Not a product name: the project brings its own key and model, so the model is what says
 * what is answering.
 * The model arrives fully qualified ("anthropic/claude-sonnet-4-5"); the provider is dropped, since
 * the model name already says it.
 */
export const assistantLabel = (model: string | undefined, setupRequired = false): string => {
    if (setupRequired) {
        return "AI assistant · no model set";
    }
    if (!model) {
        return "AI assistant";
    }
    const name = model.slice(model.lastIndexOf("/") + 1);
    return `AI assistant · ${name}`;
};
