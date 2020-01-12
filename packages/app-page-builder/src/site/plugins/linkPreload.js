import Location from "ulocation";
import buildQueryProps from "../components/Page/buildQueryProps";

export default () => {
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
