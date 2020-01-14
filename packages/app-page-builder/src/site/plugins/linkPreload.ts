import Location from "ulocation";
import buildQueryProps from "../components/Page/buildQueryProps";
import {ReactRouterOnLinkPlugin} from "@webiny/react-router/types";

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
                const queryProps = buildQueryProps({ location: new Location(link) });
                apolloClient.query(queryProps);
            }
        }
    };
};
