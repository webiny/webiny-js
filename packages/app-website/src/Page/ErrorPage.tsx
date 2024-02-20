import React from "react";
import { Helmet } from "react-helmet";
import styled from "@emotion/styled";
import { makeDecoratable } from "@webiny/app";
import { errorMessages } from "./ErrorPage/errorMessages";

const Wrapper = styled.div`
    padding: 50px;
    text-align: center;
    font-size: 18px;

    h1 {
        font-size: 30px;
        font-weight: bold;
        padding: 50px;
    }

    p {
        line-height: 1.5;
    }

    code {
        font-family: monospace;
    }
`;

interface ErrorPageProps {
    error?: any;
}

export const ErrorPage = makeDecoratable("ErrorPage", (props: ErrorPageProps) => {
    // Try retrieving the error code from standard `{ data, error }` Webiny GraphQL response.
    let errorCode: keyof typeof errorMessages = props?.error?.code;
    if (!errorCode) {
        // Alternatively, try reading the code from the network error result.
        errorCode = props?.error?.networkError?.result?.code;
    }

    const { title, message } = errorMessages[errorCode] || errorMessages.DEFAULT;

    return (
        <Wrapper>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <h1>{title}</h1>

            <div>{message}</div>
        </Wrapper>
    );
});
