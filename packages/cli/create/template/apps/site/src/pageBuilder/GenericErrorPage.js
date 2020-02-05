import React from "react";
import GenericPage from "./GenericPage";

const getPbNotInstalledErrorMessage = () => {
    // Check if window exists first (does not exist while doing SSR).
    const isLocalhost = typeof window === 'object' && window.location.hostname === "localhost";
    let adminUi = <a href="/admin">Admin UI</a>;
    if (isLocalhost) {
        adminUi = <strong>Admin UI</strong>;
    }

    return [
        "Installation incomplete",
        <>
            <p>Page Builder is not installed!</p>
            <p>
                Before you continue, please open up the {adminUi} and complete the installation
                wizard.
            </p>
        </>
    ];
};

export default function GenericErrorPage(props) {
    let message = "The link is either broken or the page has been removed.";
    let title = "An error occurred";

    // Once the Page Builder is installed, this can be safely removed.
    if (props.error.code === "PB_NOT_INSTALLED") {
        [title, message] = getPbNotInstalledErrorMessage();
    }

    return <GenericPage message={message} title={title} />;
}
