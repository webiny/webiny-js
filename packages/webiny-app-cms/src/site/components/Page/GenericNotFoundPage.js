// @flow
import React from "react";
import Body from "./Body";
import { Helmet } from "react-helmet";

export default function GenericErrorPage() {
    return (
        <Body>
            <>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>Page not found.</title>
                </Helmet>
                <div>Page not found.</div>
            </>
        </Body>
    );
}
