import React from "react";
import { isCI } from "ci-info";

export interface CiProps {
    children: React.ReactNode;
}

/**
 * Renders children only when running in a CI environment.
 */
export const IsCi: React.FC<CiProps> = ({ children }) => {
    if (!isCI) {
        return null;
    }
    return <>{children}</>;
};

/**
 * Renders children only when NOT running in a CI environment.
 */
export const IsNotCi: React.FC<CiProps> = ({ children }) => {
    if (isCI) {
        return null;
    }
    return <>{children}</>;
};
