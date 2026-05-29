import React from "react";
import { EcommerceIntegration } from "webiny/admin/website-builder";
import type { SaleorProduct } from "./SaleorApi.js";
import { SaleorApi } from "./SaleorApi.js";

type SaleorSettings = {
    apiUrl: string;
    channel: string;
};

const productCache = new Map<string, any>();

function initEcommerceApi(settings: SaleorSettings) {
    const saleorClient = new SaleorApi(settings.apiUrl, settings.channel);

    const transformProduct = (product: SaleorProduct): EcommerceIntegration.Resource => ({
        ...product,
        id: product.id,
        title: product.title,
        image: {
            src: product.image
        }
    });

    const service: EcommerceIntegration.EcommerceApi = {
        product: {
            async findById(id: string) {
                if (productCache.has(id)) {
                    return transformProduct(productCache.get(id));
                }

                const product = await saleorClient.getProduct(id);
                productCache.set(id, product);
                return transformProduct(product);
            },
            async search(searchTerm: string) {
                const products = await saleorClient.listProducts(
                    searchTerm.length > 0 ? searchTerm : undefined
                );
                return products.map(transformProduct);
            },
            getRequestObject(id: string) {
                return id;
            }
        }
    };

    return service;
}

export default () => {
    return (
        <>
            <EcommerceIntegration
                name={"SaleorEcommerce"}
                init={(settings: SaleorSettings) => initEcommerceApi(settings)}
                settings={[
                    {
                        name: "apiUrl",
                        type: "text",
                        label: "Saleor API URL",
                        description:
                            "The base URL of your Saleor instance (e.g. https://my-store.saleor.cloud)",
                        required: true
                    },
                    {
                        name: "accessToken",
                        type: "text",
                        label: "Saleor Access Token",
                        description: "Access Token for your Saleor API",
                        required: true
                    },
                    {
                        name: "channel",
                        type: "text",
                        label: "Channel",
                        description: "The Saleor channel slug to use for product queries",
                        defaultValue: "default-channel",
                        required: true
                    }
                ]}
            >
                <EcommerceIntegration.PageType
                    name={"saleorProductPage"}
                    label={"Saleor Product Page"}
                    resourceType="product"
                    previewPath={resource => `/product/${resource.id}`}
                />
            </EcommerceIntegration>
        </>
    );
};
