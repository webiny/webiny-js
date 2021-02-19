import { useReducer, useEffect } from "react";
import { set } from "dot-prop-immutable";
import { introspectionQuery, buildClientSchema } from "graphql/utilities";
import { parse, print } from "graphql/language";
import gql from "graphql-tag";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

interface UseDataSource {
    (params: { value: any; onChange: Function; getVariables?: Function });
}

const parseValue = (type, value) => {
    switch (type) {
        case "Number":
            return value.includes(".") ? parseFloat(value) : parseInt(value);
        case "Float":
            return parseFloat(value);
        case "Long":
        case "Int":
            return parseInt(value);
        default:
            return value;
    }
};

export const useDataSource: UseDataSource = ({ value, onChange, getVariables }) => {
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        schema: null,
        parsedQuery: null,
        loading: false,
        requiredInputs: []
    });
    const { createApolloClient } = useCms();

    const initEditor = async () => {
        const client = createApolloClient({ uri: value.config.url });
        const { data } = await client.query({ query: gql(introspectionQuery) });
        const schema = buildClientSchema(data);
        setState({ schema });
    };

    useEffect(() => {
        initEditor();
    }, [value.config.url]);

    const runQuery = async () => {
        const client = createApolloClient({ uri: value.config.url });
        // Check if all required variables have a preview value
        const variables = {};
        const requiredInputs = [];
        for (const v of value.config.variables) {
            if (v.required && !v.previewValue) {
                requiredInputs.push(v.name);
                continue;
            }
            variables[v.name] = parseValue(v.type, v.previewValue);
        }

        if (requiredInputs.length) {
            setState({ requiredInputs, error: "Please enter the required preview variables!" });
            return;
        }

        // Execute query
        setState({ loading: true, requiredInputs: [], error: null });
        try {
            const { data } = await client.query({
                query: gql(value.config.query),
                variables
            });
            setState({ response: data });
        } catch (e) {
            setState({ error: e.message });
        } finally {
            setState({ loading: false });
        }
    };

    const prettifyQuery = () => {
        try {
            const prettified = print(parse(value.config.query));
            onChange(set(value, "config.query", prettified));
        } catch {
            // Ignore errors
        }
    };

    const updateQuery = query => {
        let newValue = set(value, "config.query", query);

        if (typeof getVariables === "function") {
            const variables = getVariables(newValue, query);
            if (variables) {
                newValue = set(newValue, "config.variables", variables);
            }
        }

        onChange(newValue);

        try {
            setState({ parsedQuery: parse(query) });
        } catch {
            // Ignore errors
        }
    };

    return {
        query: value.config.query,
        variables: value.config.variables || [],
        state,
        setState,
        prettifyQuery,
        runQuery,
        updateQuery
    };
};
