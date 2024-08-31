import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { ReadonlyArticle } from "@demo/shared";
import { useContentSettings } from "../../ContentSettings";

const LIST_ARTICLES = gql`
    query ListArticles($where: DemoListArticlesWhereInput) {
        demo {
            listArticles(where: $where) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface ArticlesResponse {
    demo: {
        listArticles: {
            data: Array<Omit<ReadonlyArticle, "content">>;
        };
    };
}

export const useArticlesList = () => {
    const { currentLanguage, currentRegion } = useContentSettings();
    const { data, loading } = useQuery<ArticlesResponse>(LIST_ARTICLES, {
        variables: { where: { region: currentRegion.id, language: currentLanguage.id } }
    });

    if (loading) {
        return { loading: true, articles: [] };
    }

    return { loading: false, articles: data?.demo.listArticles.data || [] };
};
