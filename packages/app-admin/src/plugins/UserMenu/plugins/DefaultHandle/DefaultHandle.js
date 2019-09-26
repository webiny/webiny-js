// @flow
import React from "react";
import { ReactComponent as Account } from "@webiny/app-admin/assets/icons/round-account_circle-24px.svg";
import { Icon } from "@webiny/ui/Icon";

const DefaultHandle = () => {
    return (
        <div>
            <Icon icon={<Account />} />
        </div>
    );
};

export default DefaultHandle;
