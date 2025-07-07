import React from "react";
import { EcommercePlugin, type IEcommerceApi } from "@webiny/app-website-builder/ecommerce";
import { KiboClient } from "./kiboClient";

type KiboCommerceSettings = {
    apiHost: string;
    sharedSecret: string;
    clientId: string;
    authToken: string;
};

const productCache = new Map<string, any>();

function initEcommerceApi(settings: KiboCommerceSettings) {
    const kiboClient = new KiboClient(settings, {});
    const PAGE_SIZE = 16;

    const transformProduct = (resource: any) => ({
        ...resource,
        id: resource?.productCode,
        title: resource?.content?.productName,
        handle: resource?.productCode,
        image: {
            src: resource?.content?.productImages[0]?.imageUrl
        }
    });

    const transformCategory = (resource: any) => ({
        ...resource,
        id: resource?.categoryCode,
        title: resource?.content?.name,
        handle: resource?.content?.slug,
        image: {
            src: resource?.content?.categoryImages[0]?.imageUrl
        }
    });

    const service: IEcommerceApi = {
        product: {
            async findById(productCode: string) {
                if (productCache.has(productCode)) {
                    return transformProduct(productCache.get(productCode));
                }
                const [product] = await kiboClient.getItemsByProductCode([productCode]);

                productCache.set(productCode, product);

                return transformProduct(product);
            },
            async search(searchTerm: string) {
                const searchOptions = {
                    query: searchTerm ? `${searchTerm}` : "",
                    startIndex: 0,
                    pageSize: PAGE_SIZE
                };
                const products = await kiboClient.performProductSearch(searchOptions);
                return products.items?.map(transformProduct);
            },
            getRequestObject(productCode: string) {
                return productCode;
            }
        },
        category: {
            async findById(categoryCode: string) {
                const categories = await kiboClient.getItemsByCategoryCode([categoryCode]);
                return transformCategory(categories[0]);
            },
            async search(searchTerm: string) {
                const searchOptions = {
                    filter: searchTerm
                        ? `content.name cont ${searchTerm} or categoryCode eq ${searchTerm}`
                        : ""
                };

                const categories = await kiboClient.performCategorySearch(searchOptions);
                return categories.items?.map(transformCategory);
            },
            async findByHandle(handle: string) {
                const searchOptions = {
                    filter: `content.slug eq ${handle}`
                };
                const categories = await kiboClient.performCategorySearch(searchOptions);
                const category = categories?.items?.[0];
                return category && transformCategory(category);
            },

            getRequestObject(categoryCode: string) {
                return categoryCode;
            }
        }
    };

    return service;
}

export const Extension = () => {
    return (
        <EcommercePlugin
            name={"KiboCommerce"}
            init={(settings: KiboCommerceSettings) => initEcommerceApi(settings)}
        >
            <EcommercePlugin.PageType
                name={"kiboProductPage"}
                label={"Kibo Product Page"}
                resourceType="product"
                previewPath={resource => `/product/${resource.id}`}
            />
            <EcommercePlugin.PageType
                name={"kiboCategoryPage"}
                label={"Kibo Category Page"}
                resourceType="category"
                previewPath={resource => `/category/${resource.id}`}
            />
        </EcommercePlugin>
    );
};
