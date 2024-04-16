import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { ReadonlyArticleWithTranslations } from "@demo/shared";
import { useContentSettings } from "../../ContentSettings";
import { useEffect } from "react";

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
            data: ReadonlyArticleWithTranslations;
        };
    };
}

export const useArticle = (slug: string) => {
    const { currentLanguage, currentRegion, setTranslations } = useContentSettings();
    const { data, loading } = useQuery<ArticleResponse>(GET_ARTICLE, {
        variables: { slug, region: currentRegion.id, language: currentLanguage.id }
    });

    const article = data?.demo?.getArticle?.data || undefined;

    useEffect(() => {
        setTranslations([]);

        return () => {
            setTranslations([]);
        };
    }, [slug]);

    useEffect(() => {
        if (!article) {
            return;
        }

        setTranslations(article.translations);
    }, [article]);

    if (loading) {
        return { loading: true, article: undefined };
    }

    return { loading: false, article };
};
