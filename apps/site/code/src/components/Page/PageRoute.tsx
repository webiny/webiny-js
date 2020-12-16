import React from "react";
import { Location } from "history";
import Page from "./Page";

type PageRouteProps = { location: Location };

function PageRoute({ location }: PageRouteProps) {
    const props: { url: string; id: string } = { url: null, id: null };
    props.url = location.pathname;
    const query = new URLSearchParams(location.search);
    props.id = query.get("preview");

    return <Page {...props} />;
}

export default PageRoute;
