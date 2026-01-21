import lodashCamelCase from "lodash/camelCase";
import type { Product } from "../../types";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export const createGetProduct = (products: IManageQueryBaseResponse<Product>[]) => {
    return (name: string) => {
        const product = products.find(
            p => lodashCamelCase(p.values.title) === lodashCamelCase(name)
        );
        if (!product) {
            throw new Error(`There is no product "${name}".`);
        }
        return product;
    };
};
