import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as EnvironmentIcon } from "@webiny/app-headless-cms/admin/icons/call_split-24px.svg";
import { PermissionSelector } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionSelector";
import React from "react";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash.get";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const EnvironmentSelector = ({ value, setValue }) => {
    const { environments } = useCms();
    const environmentsList = get(environments, "environments", []).map(item => ({
        id: item.slug,
        name: item.name
    }));
    return (
        <Accordion elevation={1}>
            {[
                <AccordionItem key={0} icon={<EnvironmentIcon />} title={t`Select Environment`}>
                    <PermissionSelector
                        value={value}
                        setValue={setValue}
                        selectorKey={"environments"}
                        dataList={{
                            loading: false,
                            error: null,
                            list: environmentsList
                        }}
                    />
                </AccordionItem>
            ]}
        </Accordion>
    );
};
