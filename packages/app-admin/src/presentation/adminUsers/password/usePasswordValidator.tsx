import React from "react";
import { createContext } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import { createPasswordValidator } from "./createPasswordValidator.js";
import type { PasswordPolicy } from "./createPasswordValidator.js";

const PasswordPolicyContext = createContext<PasswordPolicy>({});

interface PasswordPolicyProviderProps {
    policy: PasswordPolicy;
    children: React.ReactNode;
}

/**
 * Hands the identity provider's password rules to the user forms. Wraps each route element rather
 * than the routes as a whole, because AdminConfig renders route elements outside the tree that
 * declared them.
 */
export const PasswordPolicyProvider = ({ policy, children }: PasswordPolicyProviderProps) => {
    return (
        <PasswordPolicyContext.Provider value={policy}>{children}</PasswordPolicyContext.Provider>
    );
};

export function usePasswordValidator() {
    const policy = useContext(PasswordPolicyContext);

    return useMemo(() => createPasswordValidator(policy), [policy]);
}
