interface QueryParams {
    query: string;
    variables: Record<string, any>;
}

export interface ApiClientConfig {
    apiHost: string;
    apiKey: string;
    apiTenant: string;
    preview?: boolean;
}

type WithPath<T> = T & {
    path?: string;
    next?: Record<string, any>;
};

export class ApiClient {
    private readonly config: ApiClientConfig;

    constructor(config: ApiClientConfig) {
        this.config = config;
    }

    async fetch({ headers, path, ...params }: WithPath<RequestInit>): Promise<any> {
        return fetch(`${this.config.apiHost}${path}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Tenant": this.config.apiTenant,
                Authorization: "Bearer " + this.config.apiKey,
                ...headers
            },
            ...params
        }).then(res => res.json());
    }

    async query({ query, variables }: QueryParams) {
        const fetchOptions = {
            next: {
                revalidate: this.config.preview ? 0 : 60
            }
        };

        const request: WithPath<RequestInit> = {
            ...fetchOptions,
            path: "/graphql",
            method: "POST",
            body: JSON.stringify({
                query,
                variables
            })
        };

        const json = await this.fetch(request);

        if (json.message) {
            throw new Error(json.message);
        }

        if (json.errors) {
            console.error(json.errors);
            throw new Error("Failed to fetch API");
        }

        return json.data;
    }
}
