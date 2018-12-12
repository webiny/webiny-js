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
                    <title>An error occurred.</title>
                </Helmet>
                <div>An error occurred.</div>
            </>
        </Body>
    );
}
