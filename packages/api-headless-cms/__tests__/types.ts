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
/**
 * Category
 */
export interface ProductCategory {
    id: string;
    entryId: string;
    title: string;
    slug: string;
}

/**
 * **** Product
 */
export interface ProductCategoryRef {
    modelId: string;
    id: string;
}
export interface ProductVariantOption {
    name: string;
    price: number;
    category: ProductCategoryRef;
    categories: ProductCategoryRef[];
    longText: string[];
}
export interface ProductVariant {
    name: string;
    price: number;
    category: ProductCategoryRef;
    options?: ProductVariantOption[];
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
    richText?: Record<string, any>;
    category: ProductCategoryRef;
    variant?: ProductVariant;
    fieldsObject?: Record<string, any>;
}
