import React from "react";
import { Helmet } from "react-helmet";
import styled from "@emotion/styled";

const Wrapper = styled.div({
    padding: 50,
    textAlign: "center",
    fontSize: 18,
    h1: {
        fontSize: 30,
        fontWeight: "bold",
        padding: 50
    },
    p: {
        lineHeight: 1.5
    }
});

const getPbNotInstalledErrorMessage = () => {
    // Check if window exists first (does not exist while doing SSR).
    const isLocalhost = typeof window === "object" && window.location.hostname === "localhost";
    let adminUi = <a href="/admin">Admin UI</a>;
    if (isLocalhost) {
        adminUi = <strong>Admin UI</strong>;
    }

    return {
        title: "Installation incomplete",
        message: (
            <>
                <p>Page Builder is not installed!</p>
                <p>
                    Before you continue, please open up the {adminUi} and complete the installation
                    wizard.
                </p>
            </>
        )
    };
};

interface ErrorPageProps {
    error?: any;
}

let DEFAULT_ERROR_INFO = {
    title: "An error occurred",
    message: <>The link is either broken or the page has been removed.</>
};

export const ErrorPage: React.FC<ErrorPageProps> = (props: ErrorPageProps) => {
    let errorInfo = DEFAULT_ERROR_INFO;
    if (props?.error?.code === "PB_NOT_INSTALLED") {
        errorInfo = getPbNotInstalledErrorMessage();
    }

    const { title, message } = errorInfo;

    return (
        <Wrapper>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <h1>{title}</h1>

            <div>{message}</div>
        </Wrapper>
    );
};
