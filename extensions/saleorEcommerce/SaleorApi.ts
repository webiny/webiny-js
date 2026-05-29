type SaleorProductNode = {
    id: string;
    name: string;
    slug: string;
    thumbnail: {
        url: string;
        alt: string;
    } | null;
    description: string | null;
    pricing: {
        priceRange: {
            start: {
                gross: { amount: number; currency: string };
            };
            stop: {
                gross: { amount: number; currency: string };
            };
        };
    } | null;
    category: {
        id: string;
        name: string;
    } | null;
};

type ProductsResponse = {
    data: {
        products: {
            edges: Array<{ node: SaleorProductNode }>;
        };
    };
};

type ProductResponse = {
    data: {
        product: SaleorProductNode | null;
    };
};

export type SaleorProduct = {
    id: string;
    title: string;
    slug: string;
    image: string;
    description: string | null;
    price: string | null;
    category: string | null;
};

const PRODUCTS_QUERY = `
  query SaleorProducts($first: Int!, $channel: String!, $filter: ProductFilterInput) {
    products(first: $first, channel: $channel, filter: $filter) {
      edges {
        node {
          id
          name
          slug
          thumbnail(size: 256) { url alt }
          description
          pricing {
            priceRange {
              start { gross { amount currency } }
              stop { gross { amount currency } }
            }
          }
          category { id name }
        }
      }
    }
  }
`;

const PRODUCT_BY_ID_QUERY = `
  query SaleorProduct($id: ID!, $channel: String!) {
    product(id: $id, channel: $channel) {
      id
      name
      slug
      thumbnail(size: 512) { url alt }
      description
      pricing {
        priceRange {
          start { gross { amount currency } }
          stop { gross { amount currency } }
        }
      }
      category { id name }
    }
  }
`;

function formatPrice(pricing: SaleorProductNode["pricing"]): string | null {
    if (!pricing) {
        return null;
    }

    const start = pricing.priceRange.start.gross;
    return `${start.amount} ${start.currency}`;
}

function transformNode(node: SaleorProductNode): SaleorProduct {
    return {
        id: node.id,
        title: node.name,
        slug: node.slug,
        image: node.thumbnail ? node.thumbnail.url : "",
        description: node.description,
        price: formatPrice(node.pricing),
        category: node.category ? node.category.name : null
    };
}

export class SaleorApi {
    private readonly apiUrl: string;
    private readonly channel: string;
    private productCache = new Map<string, SaleorProduct>();
    private listCache: SaleorProduct[] | null = null;

    constructor(apiUrl: string, channel: string) {
        this.apiUrl = apiUrl.replace(/\/+$/, "");
        this.channel = channel;
    }

    async listProducts(search?: string): Promise<SaleorProduct[]> {
        if (!search && this.listCache) {
            return [...this.listCache];
        }

        const filter = search ? { search } : undefined;

        const response = await this.query<ProductsResponse>(PRODUCTS_QUERY, {
            first: 50,
            channel: this.channel,
            filter
        });

        const products = response.data.products.edges.map(edge => transformNode(edge.node));

        if (!search) {
            this.listCache = products;
        }

        for (const product of products) {
            this.productCache.set(product.id, product);
        }

        return products;
    }

    async getProduct(id: string): Promise<SaleorProduct> {
        const cached = this.productCache.get(id);
        if (cached) {
            return cached;
        }

        const response = await this.query<ProductResponse>(PRODUCT_BY_ID_QUERY, {
            id,
            channel: this.channel
        });

        if (!response.data.product) {
            throw new Error(`Saleor product not found: ${id}`);
        }

        const product = transformNode(response.data.product);
        this.productCache.set(product.id, product);
        return product;
    }

    private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
        const res = await fetch(this.apiUrl + "/graphql/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables })
        });

        if (!res.ok) {
            throw new Error(`Saleor API error: ${res.status} ${res.statusText}`);
        }

        return (await res.json()) as T;
    }
}
