import React, { useEffect, useState } from "react";
import { request } from "graphql-request";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { ElementRenderer } from "@webiny/app-page-builder-elements/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-space-x": any;
            "pb-space-x-empty": any;
            "pb-space-x-data": any;
        }
    }
}

const GQL_API_URL = "https://api.spacex.land/graphql/";

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

export const SpaceX: ElementRenderer = props => {
    const { element } = props;
    const { getElementClassNames, getClassNames, getThemeClassNames, combineClassNames, theme } =
        usePageElements();

    const classNames = combineClassNames(
        getElementClassNames(element),
        getThemeClassNames(theme => theme.styles.typography.primary),
        getClassNames({
            display: "block",
            color: theme.styles.colors.primary
        })
    );

    const [data, setData] = useState(element?.data?.initialGqlQueryData || []);
    const [initialDataSet, setInitialDataSet] = useState(false);

    const { limit, offset, type } = element?.data?.initialGqlQueryVariables || {};

    useEffect(() => {
        const hasInitialData = Array.isArray(element?.data?.initialGqlQueryData);
        if (hasInitialData && !initialDataSet) {
            setData(element.data.initialGqlQueryData);
            setInitialDataSet(true);
            return;
        }

        const variables = { limit: parseInt(limit), offset: parseInt(offset) };
        request(GQL_API_URL, QUERIES[type], variables).then(({ data }) => setData(data));
    }, [limit, offset, type]);

    if (!data.length) {
        return (
            <pb-space-x class={classNames}>
                <pb-space-x-empty>Nothing to show.</pb-space-x-empty>
            </pb-space-x>
        );
    }

    return (
        <pb-space-x class={classNames}>
            <pb-space-x-data>
                <ul>
                    {data.map(item => (
                        <li key={item.id}>{item.name}</li>
                    ))}
                </ul>
            </pb-space-x-data>
        </pb-space-x>
    );
};
