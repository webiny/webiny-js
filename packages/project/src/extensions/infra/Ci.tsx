import React from "react";
import { isCI } from "ci-info";

export interface CiIsProps {
    children: React.ReactNode;
}

/**
 * Conditionally renders children when running in a CI environment.
 * Uses the `ci-info` library to detect CI environments.
 */
export const CiIs: React.FC<CiIsProps> = ({ children }) => {
    if (!isCI) {
        return null;
    }

    return <>{children}</>;
};

/**
 * Conditionally renders children when NOT running in a CI environment.
 * Uses the `ci-info` library to detect CI environments.
 */
export const CiIsNot: React.FC<CiIsProps> = ({ children }) => {
    if (isCI) {
        return null;
    }

    return <>{children}</>;
};
