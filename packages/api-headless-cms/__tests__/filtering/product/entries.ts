import { ProductCategory, Product, ProductManager } from "../../types";

const createProducts = ({ id }: ProductCategory): Product[] => {
    const category = {
        id,
        modelId: "category"
    };
    const products: Product[] = [];
    /**
     * Server
     */
    products.push({
        title: "Server",
        price: 37591,
        inStock: false,
        availableOn: "2021-01-01",
        color: "red",
        availableSizes: ["l", "m", "s"],
        image: "server.jpg",
        category,
        variant: {
            name: "v1",
            category,
            price: 36591,
            options: [
                {
                    name: "v1.sub server",
                    category,
                    categories: [category],
                    price: 35591,
                    longText: ["V1 server text"]
                }
            ]
        }
    });
    /**
     * TV
     */
    products.push({
        title: "TV",
        price: 781,
        availableOn: "2020-06-01",
        color: "black",
        inStock: true,
        itemsInStock: 101,
        image: "tv.png",
        availableSizes: ["s", "m", "l"],
        category,
        variant: {
            name: "v1",
            category,
            price: 681,
            options: [
                {
                    name: "v1.sub tv",
                    category,
                    categories: [category],
                    price: 581,
                    longText: ["V1 tv text"]
                }
            ]
        }
    });
    /**
     * Oven
     */
    products.push({
        title: "Oven",
        price: 199,
        availableOn: "2022-01-01",
        color: "black",
        inStock: false,
        itemsInStock: 50,
        image: "oven.png",
        availableSizes: ["s"],
        category
    });
    /**
     * Gaming Console
     */
    products.push({
        title: "Gaming Console",
        price: 889,
        availableOn: "2023-01-01",
        color: "red",
        inStock: false,
        itemsInStock: 0,
        image: "gaming-console.png",
        availableSizes: ["s", "m", "l"],
        category
    });
    /**
     * T-Shirt
     */
    products.push({
        title: "T-Shirt",
        price: 7,
        availableOn: "2022-06-06",
        color: "white",
        inStock: true,
        itemsInStock: 102392192135,
        image: "t-shirt.png",
        availableSizes: ["s", "m", "l"],
        category
    });

    return products;
};

export const createEntriesFactory = (manager: ProductManager) => {
    return async (category: ProductCategory): Promise<Product[]> => {
        const products = createProducts(category);

        const entries: Product[] = [];
        for (const product of products) {
            const [response] = await manager.createProduct({
                data: product
            });
            entries.push(response.data.createProduct.data);
        }
        return entries;
    };
};
