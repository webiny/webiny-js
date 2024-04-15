import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { ReadonlyArticle } from "@demo/shared";
import { useContentSettings } from "../../ContentSettings";

const GET_ARTICLE = gql`
    query GetArticle($slug: String!, $region: ID!, $language: ID!) {
        demo {
            getArticle(where: { slug: $slug, region: $region, language: $language }) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface ArticleResponse {
    demo: {
        getArticle: {
            data: ReadonlyArticle;
        };
    };
}

export const useArticle = (slug: string) => {
    const { currentLanguage, currentRegion } = useContentSettings();
    const { data, loading } = useQuery<ArticleResponse>(GET_ARTICLE, {
        variables: { slug, region: currentRegion.id, language: currentLanguage.id }
    });

    if (loading) {
        return { loading: true, article: undefined };
    }

    return { loading: false, article: data?.demo.getArticle.data || undefined };
};
