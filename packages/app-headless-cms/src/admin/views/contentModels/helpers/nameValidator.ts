import lodashCamelCase from "lodash/camelCase";
import { CmsModel } from "~/types";

interface Params {
    models: CmsModel[];
}

export const createNameValidator = (params: Params) => {
    const { models } = params;
    return async (name: string): Promise<boolean> => {
        const target = (name || "").trim();
        if (!target) {
            throw new Error("The name is required.");
        } else if (!target.charAt(0).match(/[a-zA-Z]/)) {
            throw new Error("The name can't start with a number.");
        } else if (models.length === 0) {
            return true;
        }

        const modelId = lodashCamelCase(target);
        const alreadyExists = models.some(model => {
            if (model.name.toLowerCase() === target.toLowerCase()) {
                return true;
            }
            return model.modelId.toLowerCase() === modelId.toLowerCase();
        });
        if (alreadyExists) {
            throw new Error(`This name is already taken.`);
        }

        return true;
    };
};
