import React, { useEffect } from "react";
import {
    createReactiveComponent,
    SimpleLink,
    TenantSelectorRenderer,
    TenantSwitcherManageItem,
    TenantSwitcherPresenterFeature,
    useAdminConfig
} from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Avatar, DropdownMenu, Icon, InputPrimitive, Sidebar } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";

const ROOT_TENANT_ID = "root";

/**
 * The tenant switcher's state, loaded once for the sidebar header and the collapsed rail.
 */
export const useTenantSwitcher = () => {
    const { presenter } = useFeature(TenantSwitcherPresenterFeature);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    return presenter;
};

interface TenantAvatarProps {
    tenant: { id: string; name: string; logo: string | null };
}

/**
 * A tenant's logo, 24px. Root shows the admin's own logo; any other tenant shows its uploaded
 * logo, or its initials when it has none, never the root's logo.
 */
export const TenantAvatar = ({ tenant }: TenantAvatarProps) => {
    const { logo, title } = useAdminConfig();

    if (tenant.id === ROOT_TENANT_ID) {
        return <Sidebar.Icon element={logo.squareLogo} label={title} />;
    }

    const initials = tenant.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");

    return (
        <Avatar
            size={"sm"}
            variant={"strong"}
            className={"shrink-0"}
            image={tenant.logo ? <Avatar.Image src={tenant.logo} alt={tenant.name} /> : undefined}
            fallback={<Avatar.Fallback delayMs={tenant.logo ? 600 : 0}>{initials}</Avatar.Fallback>}
        />
    );
};

export const TenantSelector = TenantSelectorRenderer.createDecorator(() => {
    return createReactiveComponent(function TenantSelector({ title }) {
        const presenter = useTenantSwitcher();
        const { current, tenants, canSwitch, canSearch, search } = presenter.vm;

        const isRoot = !current || current.id === ROOT_TENANT_ID;
        const name = isRoot ? title : current.name;

        if (!canSwitch) {
            return isRoot ? <SimpleLink to={"/"}>{title}</SimpleLink> : <>{name}</>;
        }

        return (
            <Sidebar.TitleMenu text={name} data-testid={"tenant-switcher"}>
                <DropdownMenu.Label text={"Switch tenant"} />
                {canSearch ? (
                    <div className={"px-xs-plus pb-xs"}>
                        <InputPrimitive
                            size={"md"}
                            placeholder={"Search tenants"}
                            value={search}
                            onChange={value => presenter.setSearch(value)}
                            startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                            // The menu moves focus on typed letters; keep the keys in the field.
                            onKeyDown={event => event.stopPropagation()}
                            autoFocus
                        />
                    </div>
                ) : null}
                {tenants.map(tenant => {
                    const isCurrent = tenant.id === current?.id;
                    return (
                        <DropdownMenu.Item
                            key={tenant.id}
                            // Stretch the label so the check mark sits at the right edge.
                            className={"[&>div>span:last-child]:flex-1"}
                            icon={<TenantAvatar tenant={tenant} />}
                            text={
                                <span className={"flex items-center justify-between gap-sm"}>
                                    <span className={"truncate"}>{tenant.name}</span>
                                    {isCurrent ? (
                                        <Icon
                                            label={"Current tenant"}
                                            icon={<CheckIcon />}
                                            size={"sm"}
                                        />
                                    ) : null}
                                </span>
                            }
                            onClick={() => presenter.switchTo(tenant.id)}
                        />
                    );
                })}
                <TenantSwitcherManageItem />
            </Sidebar.TitleMenu>
        );
    });
});
