import lodashCamelCase from "lodash/camelCase";
import { Product } from "../../types";

export const createGetProduct = (products: Product[]) => {
    return (name: string) => {
        const product = products.find(p => lodashCamelCase(p.title) === lodashCamelCase(name));
        if (!product) {
            throw new Error(`There is no product "${name}".`);
        }
        return product;
    };
};
