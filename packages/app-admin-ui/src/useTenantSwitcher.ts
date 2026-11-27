import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { TenantSwitcherPresenterFeature } from "@webiny/app-admin";

/**
 * The tenant switcher's presenter, loaded. The navigation header and the collapsed rail both call
 * this; the presenter loads once.
 */
export const useTenantSwitcher = () => {
    const { presenter } = useFeature(TenantSwitcherPresenterFeature);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    return presenter;
};
