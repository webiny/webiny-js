import React from "react";
import DefaultPage from "./DefaultPage";

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

type DefaultErrorPageProps = { error?: any };

export default function DefaultErrorPage(props: DefaultErrorPageProps) {
    let pageProps = {
        message: <>The link is either broken or the page has been removed.</>,
        title: "An error occurred"
    };

    // Once the Page Builder is installed, this can be safely removed.
    if (props?.error?.code === "PB_NOT_INSTALLED") {
        pageProps = getPbNotInstalledErrorMessage();
    }

    return <DefaultPage {...pageProps} />;
}
