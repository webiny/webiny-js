export const generateConfirmation = (modelId: string): string => {
    return `delete ${modelId}`;
};

export interface IValidateConfirmationParams {
    modelId?: string;
    confirmation?: string;
}
export const validateConfirmation = (params: IValidateConfirmationParams): boolean => {
    const { modelId, confirmation } = params;
    if (!modelId || !confirmation) {
        return false;
    }
    return confirmation === generateConfirmation(modelId);
};
