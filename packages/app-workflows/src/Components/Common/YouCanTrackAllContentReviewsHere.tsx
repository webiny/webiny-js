import React from "react";
import { useRouter } from "@webiny/app";
import { Routes } from "~/routes.js";
import { Link } from "@webiny/admin-ui";

export const YouCanTrackAllContentReviewsHere = () => {
    const { getLink } = useRouter();

    const url = getLink(Routes.Workflows.ContentReviews);

    return (
        <>
            You can track all Content Reviews <Link to={url}>here</Link>.
        </>
    );
};
