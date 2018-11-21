import { withApollo } from "react-apollo";
import { compose, withHandlers } from "recompose";
import { withSnackbar } from "webiny-app-admin/components";
import gql from "graphql-tag";

const oembedQuery = gql`
    query GetOEmbedData($url: String!) {
        cms {
            oembedData(url: $url) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export default () => {
    return compose(
        withApollo,
        withSnackbar(),
        withHandlers({
            getOEmbedData: ({ client, showSnackbar }) => async url => {
                const { data: res } = await client.query({
                    query: oembedQuery,
                    variables: { url }
                });
                const { data, error } = res.cms.oembedData;
                if (error) {
                    showSnackbar(error.message);
                    return null;
                }

                return data;
            }
        })
    );
};
