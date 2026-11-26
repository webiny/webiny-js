import React, { useEffect, useState } from "react";
import {
    ExitTenant,
    SimpleLink,
    TenantSelectorRenderer,
    useAuthentication,
    useTenantContext
} from "@webiny/app-admin";
import { DropdownMenu, Icon, useSidebar, useToast } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as UnfoldIcon } from "@webiny/icons/unfold_more.svg";

export const TenantSelector = TenantSelectorRenderer.createDecorator(() => {
    return function TenantSelector({ title }) {
        const { identity, isAuthenticated } = useAuthentication();
        const tenancy = useTenantContext();
        const toast = useToast();
        const { expanded } = useSidebar();
        const [open, setOpen] = useState(false);

        // The menu hangs off the sidebar header. Once the sidebar collapses, the header is gone.
        useEffect(() => {
            if (!expanded) {
                setOpen(false);
            }
        }, [expanded]);

        const titleLink = <SimpleLink to={"/"}>{title}</SimpleLink>;

        if (!isAuthenticated) {
            return titleLink;
        }

        const { currentTenant, defaultTenant, canSwitchTenant } = identity;

        // In their default tenant, with nowhere else to go, the user has no use for the tenant.
        if (currentTenant.id === defaultTenant.id && !canSwitchTenant) {
            return titleLink;
        }

        const copyTenantId = () => {
            navigator.clipboard.writeText(currentTenant.id);
            toast.showSuccessToast({ title: "Tenant ID copied to clipboard!" });
        };

        return (
            // Not modal: a modal menu turns off pointer events on the page, which the sidebar takes
            // for the mouse leaving it, and it collapses under the open menu.
            <DropdownMenu
                open={open}
                onOpenChange={setOpen}
                modal={false}
                trigger={
                    <button
                        type={"button"}
                        className={"flex items-center gap-x-xs cursor-pointer min-w-0"}
                        data-testid={"tenant-selector"}
                    >
                        <span className={"truncate"}>{currentTenant.name}</span>
                        <Icon
                            label={"Tenant menu"}
                            icon={<UnfoldIcon />}
                            size={"sm"}
                            className={"shrink-0 fill-neutral-strong"}
                        />
                    </button>
                }
                align={"start"}
                className={"w-[240px]"}
                data-testid={"tenant-selector-menu"}
            >
                {canSwitchTenant ? (
                    <>
                        <DropdownMenu.Label text={"Tenants"} />
                        {identity.tenants.map(tenant => {
                            const isCurrent = tenant.id === currentTenant.id;
                            return (
                                <DropdownMenu.Item
                                    key={tenant.id}
                                    // Stretch the label so the check mark sits at the right edge.
                                    className={"[&>div>span:last-child]:flex-1"}
                                    icon={<TenantBadge name={tenant.name} />}
                                    text={
                                        <span className={"flex items-center justify-between"}>
                                            {tenant.name}
                                            {isCurrent ? (
                                                <Icon
                                                    label={"Current tenant"}
                                                    icon={<CheckIcon />}
                                                    size={"sm"}
                                                />
                                            ) : null}
                                        </span>
                                    }
                                    onClick={() => {
                                        if (!isCurrent) {
                                            tenancy.setTenant(tenant.id);
                                        }
                                    }}
                                />
                            );
                        })}
                        <DropdownMenu.Separator />
                    </>
                ) : null}
                <DropdownMenu.Item
                    icon={<DropdownMenu.Item.Icon element={<CopyIcon />} label={"Copy ID"} />}
                    text={"Copy tenant ID"}
                    onClick={copyTenantId}
                />
                <ExitTenant />
            </DropdownMenu>
        );
    };
});

const TenantBadge = ({ name }: { name: string }) => {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");

    return (
        <span
            className={
                "flex items-center justify-center size-md rounded-sm bg-neutral-dimmed text-neutral-primary text-xs font-semibold shrink-0"
            }
        >
            {initials}
        </span>
    );
};
