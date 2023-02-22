import React from "react";
import { request } from "graphql-request";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import {withApollo, WithApolloClient} from "@apollo/react-hoc";

// For simplicity, we're hard-coding the GraphQL HTTP API URL here.
const GQL_API_URL = "https://spacex-production.up.railway.app/";

// These are the necessary GraphQL queries we'll need in order to retrieve data.
const QUERIES = {
    rockets: /* GraphQL */ `
        query listRockets($limit: Int, $offset: Int) {
            data: rockets(limit: $limit, offset: $offset) {
                id
                name
                description
                wikipedia
            }
        }
    `,
    dragons: /* GraphQL */ `
        query listDragons($limit: Int, $offset: Int) {
            data: dragons(limit: $limit, offset: $offset) {
                id
                name
                description
                wikipedia
            }
        }
    `
};

export interface Spacecraft {
    id: string;
    name: string;
    description: string;
    wikipedia: string;
}

// It's often useful to type the data that the page element will carry.
export interface SpaceXElementData {
    variables: {
        limit: string;
        offset: string;
        type: "rockets" | "dragons";
    };
}

export type Props = WithApolloClient<{kobajica: number}>
// The renderer React component.

export const SpaceX = withApollo(createRenderer<Props>(
    (props) => {
        // Let's retrieve the variables that were chosen by
        // the user upon dropping the page element onto the page.
        const { getLoader } = useRenderer();

        const { data, loading } = getLoader<Spacecraft[]>();
        if (loading) {
            return <div>Loading data...</div>;
        }

        if (!data.length) {
            return <>Nothing to show.</>;
        }

        // If the data has been retrieved, we render it via a simple unordered list.
        return (
            <ul>
                {data.map(item => (
                    <li key={item.id}>
                        <h1>{item.name}</h1>
                        <div>{item.description}</div>
                        <br />
                        <div>
                            More info at&nbsp;
                            <a href={item.wikipedia} target={"_blank"} rel={"noreferrer"}>
                                {item.wikipedia}
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        );
    },
    {
        loader: ({ getElement, props }) => {
            const element = getElement<SpaceXElementData>();
            const { limit, offset, type } = element.data.variables;

            return request(GQL_API_URL, QUERIES[type], {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }).then(response => response.data);
        }
    }
));
