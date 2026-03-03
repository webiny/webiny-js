type ApiProduct = {
    id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    rating: {
        rate: number;
        count: number;
    };
};

export type SampleProduct = ApiProduct & {
    id: string;
};

export class SampleApi {
    private readonly apiHost: string;
    private productCache = new Map<string, SampleProduct>();
    private listCache: Array<SampleProduct> | null = null;

    constructor(apiHost: string) {
        this.apiHost = apiHost;
    }

    async listProducts(): Promise<SampleProduct[]> {
        if (this.listCache) {
            return [...this.listCache];
        }

        const products: ApiProduct[] = (await this.fetch("/products")) ?? [];
        this.listCache = products.map(product => {
            return { ...product, id: String(product.id) };
        }) as SampleProduct[];

        return [...(this.listCache ?? [])];
    }

    async getProduct(id: string): Promise<SampleProduct> {
        if (this.productCache.has(id)) {
            return this.productCache.get(id) as SampleProduct;
        }

        const product: ApiProduct = await this.fetch(`/products/${id}`);
        product.id = String(product.id);
        this.productCache.set(product.id, product);
        return product;
    }

    private async fetch(url: string) {
        const res = await fetch(this.apiHost + url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        return await res.json();
    }
}

export const sampleApi = new SampleApi("https://fakestoreapi.com");
