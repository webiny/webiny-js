import type { CmsGroup as BaseCmsGroup, CmsModel as BaseCmsModel } from "~/types";
import type { useCategoryManageHandler } from "./testHelpers/useCategoryManageHandler";
import type { useProductManageHandler } from "./testHelpers/useProductManageHandler";

export type TestCmsModel = Omit<
    BaseCmsModel,
    "tenant" | "createdOn" | "createdBy" | "savedOn" | "isPrivate"
>;
export type CmsGroup = Omit<BaseCmsGroup, "tenant">;
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
    values: {
        title: string;
        slug: string;
    }
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
    image?: string;
    category: ProductCategoryRef;
    categories: ProductCategoryRef[];
    longText: string[];
}
export interface ProductVariant {
    name: string;
    price: number;
    images?: string[];
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
