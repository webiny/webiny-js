import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app/exports/admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { CurrentTenantFeature } from "./feature.js";

export const CurrentTenant = observer(({ children }: { children: React.ReactNode }) => {
    const { presenter } = useFeature(CurrentTenantFeature);

    useEffect(() => {
        presenter.init();
    }, []);

    const vm = presenter.vm;

    if (vm.loading) {
        return <OverlayLoader text={"Loading tenant..."} />;
    }

    if (vm.error) {
        return <OverlayLoader text={vm.error.message} />;
    }

    if (!vm.tenant) {
        return <OverlayLoader text={"Unable to load tenant!"} />;
    }

    return <>{children}</>;
});
