// @flow
import React from "react";
import { Helmet } from "react-helmet";

export default function GenericErrorPage() {
    return (
        <div className="webiny-cms-page">
            <>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>An error occurred.</title>
                </Helmet>
                <div>An error occurred.</div>
            </>
        </div>
    );
}
