import React from "react";
import DefaultPage from "./DefaultPage";

export default function DefaultNotFoundPage() {
    return (
        <DefaultPage
            message={"The link is either broken or the page has been removed."}
            title={"Page not found"}
        />
    );
}
