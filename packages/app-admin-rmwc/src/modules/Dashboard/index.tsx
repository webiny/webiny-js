import * as React from "react";
import { CenteredView, DashboardConfig } from "@webiny/app-admin";
import { SimpleForm, SimpleFormHeader } from "@webiny/app-admin/components/SimpleForm";
import { useSecurity } from "@webiny/app-security";
import { Widgets } from "./Widgets";
import { Footer } from "./Footer";
import { plugins } from "@webiny/plugins";
import { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-plugin-admin-welcome-screen/types";

const ViewDecorator = DashboardConfig.View.createDecorator(() => {
    return function ViewRenderer() {
        const { identity } = useSecurity();

        if (!identity) {
            return null;
        }

        return (
            <>
                <DashboardConfig.View.Container>
                    <DashboardConfig.View.Header />
                    <DashboardConfig.View.Widgets />
                    <DashboardConfig.View.Footer />
                </DashboardConfig.View.Container>
            </>
        );
    };
});

const ContainerDecorator = DashboardConfig.View.Container.createDecorator(() => {
    return function Container({ children }) {
        return (
            <CenteredView maxWidth={1300}>
                <SimpleForm>{children}</SimpleForm>
            </CenteredView>
        );
    };
});

const HeaderDecorator = DashboardConfig.View.Header.createDecorator(() => {
    return function Header() {
        const { identity } = useSecurity();

        if (!identity) {
            return null;
        }

        return <SimpleFormHeader title={`Hi, ${identity.displayName}!`} />;
    };
});

const WidgetsDecorator = DashboardConfig.View.Widgets.createDecorator(() => {
    return Widgets;
});

const FooterDecorator = DashboardConfig.View.Footer.createDecorator(() => {
    return Footer;
});

const LegacyDashboardWidgets = () => {
    const { identity, getPermission } = useSecurity();

    if (!identity) {
        return null;
    }

    const widgets = plugins
        .byType<AdminWelcomeScreenWidgetPlugin>("admin-welcome-screen-widget")
        .filter(pl => {
            if (pl.permission) {
                return getPermission(pl.permission);
            }
            return true;
        });

    return (
        <>
            {widgets.map(plugin => {
                const { widget } = plugin;
                const name = String(plugin.name).replace("admin-welcome-screen-widget-", "");

                return (
                    <DashboardConfig.Widget
                        key={name}
                        name={name}
                        label={widget.title}
                        description={widget.description}
                        cta={widget.cta}
                    />
                );
            })}
        </>
    );
};

export const Dashboard: React.FC = () => {
    return (
        <>
            <DashboardConfig>
                <LegacyDashboardWidgets />
                <ViewDecorator />
                <ContainerDecorator />
                <HeaderDecorator />
                <WidgetsDecorator />
                <FooterDecorator />
            </DashboardConfig>
        </>
    );
};
