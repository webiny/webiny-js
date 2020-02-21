import { ReactRouterOnLinkPlugin } from "@webiny/react-router/types";
import { GET_PUBLISHED_PAGE } from "../components/Page/graphql";

export default (): ReactRouterOnLinkPlugin => {
    const preloadedLinks = [];

    return {
        name: "react-router-on-link-pb",
        type: "react-router-on-link",
        onLink({ link, apolloClient }) {
            if (process.env.REACT_APP_ENV === "browser") {
                if (!link.startsWith("/") || preloadedLinks.includes(link)) {
                    return;
                }

                preloadedLinks.push(link);
                apolloClient.query({
                    query: GET_PUBLISHED_PAGE(),
                    variables: { url: link, id: null }
                });
            }
        }
    };
};
