import React from "react";
import GenericPage from "./GenericPage";

const getPbNotInstalledErrorMessage = () => {
    const isLocalhost = window.location.hostname === "localhost";
    const title = "Installation incomplete";
    if (isLocalhost) {
        return [
            title,
            <>
                <p>Page Builder is not installed!</p>
                <p>
                    Before you continue, please open up the <strong>Admin UI</strong> and complete
                    the installation wizard.
                </p>
            </>
        ];
    }

    return [
        title,
        <>
            <p>Page Builder is not installed!</p>
            <p>
                Before you continue, please open up the{" "}
                <a href={window.location.origin + "/admin"}>Admin UI</a> and complete the
                installation wizard.
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
