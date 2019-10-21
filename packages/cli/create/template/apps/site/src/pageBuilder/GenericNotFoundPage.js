// @flow
import React from "react";
import { Helmet } from "react-helmet";

export default function GenericErrorPage() {
    return (
        <div>
            <>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>Page not found.</title>
                </Helmet>
                <div>Page not found.</div>
            </>
        </div>
    );
}
