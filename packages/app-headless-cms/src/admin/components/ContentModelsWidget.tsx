import React from "react";
import { Widget } from "@webiny/admin-ui";
import { ReactComponent as CmsIcon } from "@webiny/icons/devices_other.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

export const ContentModelsWidget = () => {
    const { goToRoute } = useRouter();

    return (
        <Widget
            variant="accent"
            title="CMS"
            icon={<Widget.Icon icon={<CmsIcon />} label={"CMS icon"} />}
            padding="md"
            footerStartActions={
                <Widget.Action
                    icon={<AddIcon />}
                    onClick={() => goToRoute(Routes.ContentModels.List)}
                >
                    New Content Model
                </Widget.Action>
            }
        >
            GraphQL based headless CMS with powerful content modeling features.
        </Widget>
    );
};
