import React from "react";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface RequestReviewProps {
    page: PbPageData;
}

const RequestReview: React.FC<RequestReviewProps> = () => {
    return null;
};

export default makeComposable("RequestReview", RequestReview);
