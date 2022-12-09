import { CmsModel as BaseCmsModel } from "~/types";
import { useCategoryManageHandler } from "./testHelpers/useCategoryManageHandler";
import { useProductManageHandler } from "./testHelpers/useProductManageHandler";

export type CmsModel = Omit<
    BaseCmsModel,
    | "locale"
    | "tenant"
    | "webinyVersion"
    | "lockedFields"
    | "createdOn"
    | "createdBy"
    | "savedOn"
    | "isPrivate"
>;
/**
 * Managers / Readers
 */
export type CategoryManager = ReturnType<typeof useCategoryManageHandler>;
export type ProductManager = ReturnType<typeof useProductManageHandler>;

/**
 * CMS Entries
 */
export interface ProductCategory {
    id: string;
    title: string;
    slug: string;
}
export interface Product {
    title: string;
    price: number;
    inStock: boolean;
    itemsInStock?: number;
    availableOn: string;
    color: string;
    availableSizes: string[];
    image: string;
    category: {
        modelId: string;
        id: string;
    };
}
