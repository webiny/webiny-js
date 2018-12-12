// @flow
import { getPage, getErrorPage, getHomePage, getNotFoundPage } from "../../graphql/pages";

const getQueryProps = (props: Object) => {
    const { error, match } = props;
    if (error) {
        return {
            query: getErrorPage()
        };
    }

    if (!match) {
        return {
            query: getNotFoundPage()
        };
    }

    if (match.url === "/") {
        return {
            query: getHomePage()
        };
    }

    return {
        query: getPage(),
        variables: { url: match.url }
    };
};

export default getQueryProps;
