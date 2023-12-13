import * as React from "react";
import { CompositionProvider } from "@webiny/react-composition";
import { Property, createConfigurableComponent } from "~/index";

interface AddWidgetProps {
    name: string;
    type: string;
}

const AddWidget = <T extends Record<string, unknown>>(props: T & AddWidgetProps) => {
    return (
        <Property id={props.name} name={"widget"} array>
            {Object.keys(props).map(name => (
                <Property key={name} id={`${props.name}:${name}`} name={name} value={props[name]} />
            ))}
        </Property>
    );
};

export interface CardWidget extends Record<string, unknown> {
    title: string;
    description: string;
    button: React.ReactElement;
}

interface DashboardViewProps {
    onProperties(properties: Property[]): void;
    children: React.ReactNode;
}

interface DashboardConfigData {
    widget: [];
}

const { Config, WithConfig, useConfig } =
    createConfigurableComponent<DashboardConfigData>("Dashboard");

export const DashboardConfig = Object.assign(Config, { AddWidget });

export const useDashboardConfig = useConfig;

export const App = ({ onProperties, children }: DashboardViewProps) => {
    return (
        <CompositionProvider>
            <DashboardConfig>
                <AddWidget<CardWidget>
                    name="my-widget"
                    type="card"
                    title="My Widget"
                    description="Custom widget that shows current weather."
                    button={<button>Show Weather</button>}
                />
            </DashboardConfig>
            <WithConfig onProperties={onProperties}>{children}</WithConfig>
        </CompositionProvider>
    );
};
