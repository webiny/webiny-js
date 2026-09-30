import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useIdentity } from "@webiny/app-admin";
import { canAccessContentReviews } from "./canAccessContentReviews.js";

interface HasContentReviewsAccessProps {
    children: React.ReactNode;
}

/**
 * Renders Content Reviews only for an identity that can take part in a review. See
 * `canAccessContentReviews` for the rule.
 */
export const HasContentReviewsAccess = createReactiveComponent(
    ({ children }: HasContentReviewsAccessProps) => {
        const { identity } = useIdentity();

        if (!canAccessContentReviews(identity)) {
            return null;
        }

        return <>{children}</>;
    }
);
