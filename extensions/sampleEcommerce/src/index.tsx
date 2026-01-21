import React from "react";
import type { Resource } from "@webiny/app-website-builder/ecommerce";
import { EcommercePlugin, type IEcommerceApi } from "@webiny/app-website-builder/ecommerce";
import type { SampleProduct } from "./SampleApi";
import { SampleApi } from "./SampleApi";

type SampleSettings = {
    apiHost: string;
};

const productCache = new Map<string, any>();

function initEcommerceApi(settings: SampleSettings) {
    const sampleClient = new SampleApi(settings.apiHost);

    const transformProduct = (resource: SampleProduct): Resource => ({
        ...resource,
        id: resource?.id,
        title: resource?.title,
        image: {
            src: resource.image
        }
    });

    const service: IEcommerceApi = {
        product: {
            async findById(id: string) {
                if (productCache.has(id)) {
                    return transformProduct(productCache.get(id));
                }
                const product = await sampleClient.getProduct(id);

                productCache.set(id, product);

                return transformProduct(product);
            },
            async search(searchTerm: string) {
                const products = await sampleClient.listProducts();

                if (searchTerm.length > 0) {
                    return products.filter(p => p.title.includes(searchTerm)).map(transformProduct);
                }
                return products.map(transformProduct);
            },
            getRequestObject(id: string) {
                return id;
            }
        }
    };

    return service;
}

export const Extension = () => {
    return (
        <>
            <EcommercePlugin
                name={"SampleEcommerce"}
                init={(settings: SampleSettings) => initEcommerceApi(settings)}
                settings={[
                    {
                        name: "apiHost",
                        type: "text",
                        defaultValue: "https://fakestoreapi.com",
                        required: true
                    }
                ]}
            >
                <EcommercePlugin.PageType
                    name={"sampleProductPage"}
                    label={"Sample Product Page"}
                    resourceType="product"
                    previewPath={resource => `/product/${resource.id}`}
                />
            </EcommercePlugin>
        </>
    );
};
