import * as React from "react";
import { Query } from "@apollo/react-components";
import gql from "graphql-tag";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "ps-tag": {
                "data-key": string;
                "data-value": string;
            };
        }
    }
}

export interface PublishedMenuData {
    title: string;
    slug: string;
    items: Array<{
        id: string;
        title: string;
        path: string;
        url: string;
        children: Array<{
            id: string;
            title: string;
            path: string;
            url: string;
        }>;
    }>;
}

export interface PublishedMenuError {
    code: string;
    message: string;
    data: Record<string, any>;
}

export interface GetPublishMenuResponse {
    pageBuilder: {
        getPublicMenu: {
            data: PublishedMenuData;
            error: PublishedMenuError;
        };
    };
}

export const hasMenuItems = (data: GetPublishMenuResponse) => {
    return data?.pageBuilder?.getPublicMenu?.data?.items?.length > 0;
};

export const GET_PUBLIC_MENU = gql`
    query GetPublicMenu($slug: String!) {
        pageBuilder {
            getPublicMenu(slug: $slug) {
                data {
                    slug
                    title
                    items
                }
                error {
                    code
                }
            }
        }
    }
`;

interface Props {
    slug: string;
    component: React.ComponentType<{ data?: PublishedMenuData }>;
}

const Menu: React.FC<Props> = ({ slug, component: Component }) => {
    return (
        <Query<GetPublishMenuResponse> query={GET_PUBLIC_MENU} variables={{ slug }}>
            {({ data }) => (
                <>
                    <ps-tag data-key="pb-menu" data-value={slug} />
                    <Component data={data?.pageBuilder?.getPublicMenu?.data} />
                </>
            )}
        </Query>
    );
};

export default Menu;
