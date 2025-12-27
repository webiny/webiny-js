import { useFeature } from "@webiny/app";
import { autorun } from "mobx";
import { useEffect, useState } from "react";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";

export function useIdentityContext() {
    const { identityContext } = useFeature(IdentityContextFeature);
    const [identity, setIdentity] = useState<IdentityContext.Identity | undefined>(undefined);

    useEffect(() => {
        return autorun(() => {
            setIdentity(identityContext.getIdentity());
        });
    }, []);

    return {
        identity,
        getPermission: identityContext.getPermission.bind(identityContext),
        getPermissions: identityContext.getPermissions.bind(identityContext)
    };
}
