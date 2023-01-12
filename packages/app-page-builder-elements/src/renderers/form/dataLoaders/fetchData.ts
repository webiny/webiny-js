export interface FetchParams {
    apiUrl: string;
    query: string;
    variables: Record<string, any>;
    includeHeaders?: Record<string, any>;
}

export const fetchData = (params: FetchParams) => {
    const { apiUrl, query, variables, includeHeaders = {} } = params;
    if (!apiUrl) {
        throw new Error(
            "Form data cannot be initialized because the API URL parameter wasn't provided."
        );
    }

    return fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...includeHeaders
        },
        body: JSON.stringify({
            query,
            variables
        })
    }).then(res => res.json());
};
