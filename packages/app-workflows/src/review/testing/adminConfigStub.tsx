import React from "react";

interface StubProps {
    children?: React.ReactNode;
    [key: string]: unknown;
}

const Passthrough = ({ children }: StubProps) => {
    return <>{children}</>;
};

const Route = (props: StubProps) => {
    const route = props.route as { name: string };
    return (
        <div data-testid="route" data-name={route.name}>
            {props.element as React.ReactNode}
        </div>
    );
};

const MenuLinkIcon = () => {
    return <span />;
};

const MenuLink = (props: StubProps) => {
    return (
        <a data-testid="menu-link" href={props.to as string}>
            {props.text as string}
        </a>
    );
};

const Menu = (props: StubProps) => {
    return (
        <div
            data-testid="menu"
            data-name={props.name as string}
            data-parent={(props.parent as string | undefined) ?? ""}
        >
            {props.element as React.ReactNode}
        </div>
    );
};

const Widget = (props: StubProps) => {
    return (
        <div
            data-testid="widget"
            data-name={props.name as string}
            data-column={props.column as string}
        >
            {props.element as React.ReactNode}
        </div>
    );
};

const Breadcrumb = (props: StubProps) => {
    return (
        <span
            data-testid="breadcrumb"
            data-name={props.name as string}
            data-label={props.label as string}
        />
    );
};

// Test double of the pieces of `@webiny/app-admin` the mounting components use.
export const createAdminConfigStub = () => {
    const MenuWithLink = Object.assign(Menu, {
        Link: Object.assign(MenuLink, { Icon: MenuLinkIcon })
    });
    const AdminConfig = Object.assign(Passthrough, {
        Route,
        Menu: MenuWithLink,
        Breadcrumb,
        Dashboard: { Widget }
    });
    return { AdminConfig, AdminLayout: Passthrough };
};
