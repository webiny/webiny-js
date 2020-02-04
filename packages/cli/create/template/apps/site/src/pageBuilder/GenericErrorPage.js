import React from "react";
import GenericPage from "./GenericPage";

const getPbNotInstalledErrorMessage = ({ error }) => {
    const isLocalhost = window.location.hostname === "localhost";
    if (isLocalhost) {
        return (
            <>
                <p>Page Builder is not installed!</p>
                <p>
                    Before you continue, please open up the <strong>Admin UI</strong> and complete
                    the installation wizard.
                </p>
            </>
        );
    }

    return (
        <>
            <p>Page Builder is not installed!</p>
            <p>
                Before you continue, please open up the{" "}
                <a href={window.location.origin + "/admin"}>Admin UI</a> and complete the
                installation wizard.
            </p>
        </>
    );
};

export default function GenericErrorPage(props) {
    let message = "The link is either broken or the page has been removed.";
    if (props.error.code === "PB_NOT_INSTALLED") {
        message = getPbNotInstalledErrorMessage(props);
    }

    return <GenericPage message={message} title={"An error occurred"} />;
}
