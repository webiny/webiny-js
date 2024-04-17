import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { ContentRegion } from "@demo/shared";

const GET_CONTENT_REGIONS = gql`
    query ContentRegions {
        demo {
            getCompany {
                data {
                    name
                    logo
                }
            }
            getContentRegions {
                data {
                    id
                    title
                    slug
                    languages {
                        id
                        name
                        slug
                    }
                }
            }
        }
    }
`;

interface ContentRegionsResponse {
    demo: {
        getCompany: {
            data: {
                name: string;
                logo: string;
            };
        };
        getContentRegions: {
            data: Array<ContentRegion>;
        };
    };
}

export const useContentRegions = () => {
    const { data, loading } = useQuery<ContentRegionsResponse>(GET_CONTENT_REGIONS);

    if (loading) {
        return { loading: true, regions: [] };
    }

    return {
        loading: false,
        regions: data?.demo.getContentRegions.data || [],
        company: data?.demo.getCompany.data
    };
};
