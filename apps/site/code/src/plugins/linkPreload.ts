import { ReactRouterOnLinkPlugin } from "@webiny/react-router/types";
import gql from "graphql-tag";
import { GET_PUBLISHED_PAGE } from "../components/Page/graphql";

const fileSafeId = url => {
    return "page--" + url.replace(/\//g, "-");
};

export default (): ReactRouterOnLinkPlugin => {
    const preloadedLinks = [];

    return {
        name: "react-router-on-link-pb",
        type: "react-router-on-link",
        async onLink({ link, apolloClient }) {
            if (process.env.REACT_APP_ENV === "browser") {
                if (
                    typeof link !== "string" ||
                    !link.startsWith("/") ||
                    preloadedLinks.includes(link)
                ) {
                    return;
                }

                preloadedLinks.push(link);

                const pageState = await fetch(`/cache/${fileSafeId(link)}/apollo.json`)
                    .then(res => res.json())
                    .catch(() => null);

                if (!pageState) {
                    apolloClient.query({
                        query: GET_PUBLISHED_PAGE(),
                        variables: {
                            id: null,
                            url: link,
                            preview: false,
                            returnErrorPage: true,
                            returnNotFoundPage: true
                        }
                    });
                } else {
                    for (let i = 0; i < pageState.length; i++) {
                        const { query, variables, data } = pageState[i];
                        apolloClient.writeQuery({
                            query: gql`
                                ${query}
                            `,
                            data,
                            variables
                        });
                    }
                }
            }
        }
    };
};
