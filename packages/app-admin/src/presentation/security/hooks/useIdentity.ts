import { useEffect, useState } from "react";
import { autorun } from "mobx";
import type { Identity } from "~/domain/Identity.js";
import { useFeature } from "@webiny/app";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";

export interface IUseIdentityReturn {
    identity: Identity;
    isAuthenticated: boolean;
}

export function useIdentity(): IUseIdentityReturn {
    const { identityContext } = useFeature(IdentityContextFeature);

    const [identity, setIdentity] = useState<Identity>(identityContext.getIdentity());
    const [isAuthenticated, setIsAuthenticated] = useState(identity.isAuthenticated);

    useEffect(() => {
        const dispose = autorun(() => {
            const identity = identityContext.getIdentity();
            setIdentity(identity);
            setIsAuthenticated(identity.isAuthenticated);
        });

        return () => dispose();
    }, [identityContext]);

    return {
        identity,
        isAuthenticated
    };
}
