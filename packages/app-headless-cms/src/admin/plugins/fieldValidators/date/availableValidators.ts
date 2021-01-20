export const getAvailableValidators = (type?: string): string[] => {
    const validators = ["required"];
    if (!type) {
        return validators;
    } else if (type === "time") {
        return validators.concat(["timeGte", "timeLte"]);
    }
    return validators.concat(["dateGte", "dateLte"]);
};
