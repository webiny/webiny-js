import { app } from "webiny-app";
import gql from "graphql-tag";

export default {
    loadPage: url => {
        const query = gql`
            query LoadPage($url: String!) {
                loadPageByUrl(url: $url) {
                    id
                    title
                    slug
                    content
                }
            }
        `;

        return app.graphql.query({ query, variables: { url } }).then(({ data }) => {
            return data.loadPageByUrl;
        });
    },

    loadPageRevision: id => {
        const query = gql`
            query LoadPageRevision($id: String!) {
                loadPageRevision(id: $id) {
                    id
                    title
                    slug
                    content
                }
            }
        `;

        return app.graphql.query({ query, variables: { id } }).then(({ data }) => {
            return data.loadPageRevision;
        });
    }
};
