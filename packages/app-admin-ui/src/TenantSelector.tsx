import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { SimpleLink } from "@webiny/app-admin";
import { TenantSelectorRenderer } from "@webiny/app-admin";
import { TenantSwitcherManageItem } from "@webiny/app-admin";
import { TenantSwitcherPresenter } from "@webiny/app-admin";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { InputPrimitive } from "@webiny/admin-ui";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { TenantAvatar } from "./TenantAvatar.js";
import { useTenantSwitcher } from "./useTenantSwitcher.js";

interface TenantRowProps {
    tenant: TenantSwitcherPresenter.Tenant;
    isCurrent: boolean;
    onSelect: () => void;
}

const TenantRow = ({ tenant, isCurrent, onSelect }: TenantRowProps) => {
    let check: React.ReactNode = null;
    if (isCurrent) {
        check = <Icon label={"Current tenant"} icon={<CheckIcon />} size={"sm"} />;
    }

    return (
        <DropdownMenu.Item
            // Stretch the label so the check mark sits at the right edge.
            className={"[&>div>span:last-child]:flex-1"}
            icon={<TenantAvatar tenant={tenant} />}
            text={
                <span className={"flex items-center justify-between gap-sm"}>
                    <span className={"truncate"}>{tenant.name}</span>
                    {check}
                </span>
            }
            onClick={onSelect}
        />
    );
};

export const TenantSelector = TenantSelectorRenderer.createDecorator(() => {
    return createReactiveComponent(function TenantSelector({ title }) {
        const presenter = useTenantSwitcher();
        const { current, tenants, canSwitch, canSearch, search } = presenter.vm;

        const isRoot = !current || current.isRoot;
        const name = isRoot ? title : current.name;

        if (!canSwitch && isRoot) {
            return <SimpleLink to={"/"}>{title}</SimpleLink>;
        }

        if (!canSwitch) {
            return <>{name}</>;
        }

        let searchField: React.ReactNode = null;
        if (canSearch) {
            searchField = (
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
            );
        }

        return (
            <Sidebar.TitleMenu text={name} data-testid={"tenant-switcher"}>
                <DropdownMenu.Label text={"Switch tenant"} />
                {searchField}
                {/* Scrolls on its own, so search and "Manage tenants" stay on screen. */}
                <div className={"max-h-[50vh] overflow-y-auto"}>
                    {tenants.map(tenant => (
                        <TenantRow
                            key={tenant.id}
                            tenant={tenant}
                            isCurrent={tenant.id === current?.id}
                            onSelect={() => presenter.switchTo(tenant.id)}
                        />
                    ))}
                </div>
                <TenantSwitcherManageItem />
            </Sidebar.TitleMenu>
        );
    });
});
