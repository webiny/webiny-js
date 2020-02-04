import React from "react";
import GenericPage from "./GenericPage";

export default function GenericNotFoundPage() {
    return (
        <GenericPage
            message={"The link is either broken or the page has been removed."}
            title={"Page not found"}
        />
    );
}
