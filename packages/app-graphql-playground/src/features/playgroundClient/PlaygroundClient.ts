import { PlaygroundClient } from "./abstractions.js";

export class PlaygroundClientImpl implements PlaygroundClient.Interface {
    private readonly defaultEndpoint: string;
    private readonly getToken: PlaygroundClient.TokenGetter;

    constructor(defaultEndpoint: string, getToken: PlaygroundClient.TokenGetter) {
        this.defaultEndpoint = defaultEndpoint;
        this.getToken = getToken;
    }

    public async execute(params: PlaygroundClient.Request): Promise<PlaygroundClient.Response> {
        const endpoint = params.endpoint || this.defaultEndpoint;

        const defaultHeaders: PlaygroundClient.Headers = {
            "Content-Type": "application/json"
        };

        const token = await this.getToken();
        if (token) {
            defaultHeaders["Authorization"] = `Bearer ${token}`;
        }

        const userHeaders = params.headers || {};

        const headers: PlaygroundClient.Headers = {
            ...defaultHeaders,
            ...userHeaders
        };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    query: params.query,
                    variables: params.variables
                })
            });

            const result = await response.json();

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            return {
                errors: [
                    {
                        message: `Network error: ${message}`
                    }
                ]
            };
        }
    }
}
