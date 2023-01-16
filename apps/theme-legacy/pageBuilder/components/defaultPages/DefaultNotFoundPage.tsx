import React from "react";
import DefaultPage from "./DefaultPage";

const DefaultNotFoundPage: React.FC = () => {
    return (
        <DefaultPage
            message={"The link is either broken or the page has been removed."}
            title={"Page not found"}
        />
    );
};
export default DefaultNotFoundPage;
