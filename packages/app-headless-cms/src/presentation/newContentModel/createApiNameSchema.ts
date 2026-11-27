import { z } from "zod";
import lodashUpperFirst from "lodash/upperFirst.js";
import lodashCamelCase from "lodash/camelCase.js";
import { CMS_MODEL_DISALLOWED_API_NAME_ENDINGS } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "~/types.js";

export const createApiNameSchema = (getModels: () => CmsModel[]) => {
    return z
        .string()
        .max(100, "Value is too long, maximum 100 characters.")
        .superRefine((name, ctx) => {
            const value = name.trim();

            if (!value.charAt(0).match(/[a-zA-Z]/)) {
                ctx.addIssue({ code: "custom", message: "The name can't start with a number." });
                return;
            }

            const transformed = lodashUpperFirst(lodashCamelCase(value));
            if (transformed !== value) {
                ctx.addIssue({
                    code: "custom",
                    message: `The name "${value}" must be in form of Upper First + Camel Cased word. For example: "ArticleCategory", "ArticleAuthor" or "BlogCategories".`
                });
                return;
            }

            for (const ending of CMS_MODEL_DISALLOWED_API_NAME_ENDINGS) {
                if (value.endsWith(ending)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `The name must not end with "${ending}".`
                    });
                    return;
                }
            }

            const exists = getModels().some(
                model => model.singularApiName === value || model.pluralApiName === value
            );
            if (exists) {
                ctx.addIssue({
                    code: "custom",
                    message: `"${value}" API name already exists. Please pick a different value.`
                });
            }
        });
};
