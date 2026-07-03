import { PlaygroundClient as PlaygroundClientAbstraction } from "./abstractions/PlaygroundClient.js";

export class PlaygroundClient implements PlaygroundClientAbstraction.Interface {
    private readonly defaultEndpoint: string;
    private readonly getToken: PlaygroundClientAbstraction.TokenGetter;

    private constructor(
        defaultEndpoint: string,
        getToken: PlaygroundClientAbstraction.TokenGetter
    ) {
        this.defaultEndpoint = defaultEndpoint;
        this.getToken = getToken;
    }

    public static create(
        defaultEndpoint: string,
        getToken: PlaygroundClientAbstraction.TokenGetter
    ) {
        return new PlaygroundClient(defaultEndpoint, getToken);
    }

    public async execute(
        params: PlaygroundClientAbstraction.Request
    ): Promise<PlaygroundClientAbstraction.Response> {
        const endpoint = params.endpoint || this.defaultEndpoint;

        const defaultHeaders: PlaygroundClientAbstraction.Headers = {
            "Content-Type": "application/json"
        };

        const token = await this.getToken();
        if (token) {
            defaultHeaders["Authorization"] = `Bearer ${token}`;
        }

        const userHeaders = params.headers || {};

        const headers: PlaygroundClientAbstraction.Headers = {
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

            return await response.json();
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
