import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";
import { css } from "emotion";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { useTenancy } from "@webiny/app-tenancy/hooks/useTenancy";
import { useSecurity } from "@webiny/app-security";

const buttonStyles = css({
    marginRight: 10
});

const TenantSelector = () => {
    const { identity } = useSecurity();
    const { setTenant } = useTenancy();

    if (!identity.tenant.parent) {
        return null;
    }

    return (
        <ButtonPrimary
            className={buttonStyles}
            flat
            onClick={() => setTenant(identity.tenant.parent)}
        >
            Back to home tenant
        </ButtonPrimary>
    );
};

export default new UIViewPlugin<AdminView>(AdminView, view => {
    const tenantSelector = new GenericElement("tenantSelector", () => <TenantSelector />);
    tenantSelector.moveToTheBeginningOf(view.getHeaderElement().getRightSection());
});
