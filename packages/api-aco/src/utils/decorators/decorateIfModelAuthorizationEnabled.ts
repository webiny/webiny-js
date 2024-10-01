import { CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";

/**
 * This type matches any function that has a CmsModel as the first parameter.
 */
type ModelCallable = (model: CmsModel, ...params: any[]) => any;

/**
 * This type filters only `ModelCallable` methods.
 */
type FilterModelMethods<T> = {
    [K in keyof T as ModelCallable extends T[K] ? K : never]: T[K];
};

/**
 * This type omits methods that have a more complex `model` type.
 * E.g., `getEntryManager` has `model` typed as `CmsModel | string`.
 * Ideally, we would filter those out in the previous utility type, but I'm not sure how to achieve that.
 */
type ModelMethods<T> = Omit<FilterModelMethods<T>, "getEntryManager" | "getSingletonEntryManager">;

/**
 * Decorator takes the decoratee as the _first_ parameter, and then forwards the rest of the parameters.
 */
type Decorator<T extends ModelCallable> = (decoratee: T, ...args: Parameters<T>) => ReturnType<T>;

const modelAuthorizationDisabled = (model: CmsModel) => {
    if (typeof model.authorization === "object") {
        return model?.authorization?.flp === false;
    }

    return model.authorization === false;
};

export const decorateIfModelAuthorizationEnabled = <
    /**
     * This allows us to only have an auto-complete of `ModelCallable` methods.
     */
    M extends keyof ModelMethods<HeadlessCms>,
    D extends Decorator<ModelMethods<HeadlessCms>[M]>
>(
    root: ModelMethods<HeadlessCms>,
    method: M,
    decorator: D
) => {
    /**
     * We cast to `ModelCallable` because within the generic function, we only know that the first
     * parameter is a `CmsModel`, and we forward the rest.
     */
    const decoratee = root[method].bind(root) as ModelCallable;
    root[method] = ((...params: Parameters<ModelMethods<HeadlessCms>[M]>) => {
        const [model, ...rest] = params;
        if (modelAuthorizationDisabled(model)) {
            return decoratee(model, ...rest);
        }

        return decorator(decoratee, ...params);
    }) as ModelCallable;
};
