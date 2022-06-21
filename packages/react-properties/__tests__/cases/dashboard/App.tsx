import * as React from "react";
import { useEffect, useState } from "react";
import {
    Compose,
    HigherOrderComponent,
    makeComposable,
    CompositionProvider
} from "@webiny/react-composition";
import { Property, Properties } from "~/index";

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

const createHOC =
    (newChildren: React.ReactNode): HigherOrderComponent =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
    };

const DashboardConfigApply = makeComposable("DashboardConfigApply", ({ children }) => {
    return <>{children}</>;
});

interface DashboardConfig extends React.FC<unknown> {
    AddWidget: typeof AddWidget;
    DashboardRenderer: typeof DashboardRenderer;
}

export const DashboardConfig: DashboardConfig = ({ children }) => {
    return <Compose component={DashboardConfigApply} with={createHOC(children)} />;
};

const DashboardRenderer = makeComposable("DashboardRenderer", () => {
    return <div>Renderer not implemented!</div>;
});

DashboardConfig.AddWidget = AddWidget;
DashboardConfig.DashboardRenderer = DashboardRenderer;

interface ViewContext {
    properties: Property[];
}

const defaultContext = { properties: [] };

const ViewContext = React.createContext<ViewContext>(defaultContext);

interface DashboardViewProps {
    onProperties(properties: Property[]): void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onProperties }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const context = { properties };

    useEffect(() => {
        onProperties(properties);
    }, [properties]);

    const stateUpdater = (properties: Property[]) => {
        setProperties(properties);
    };

    return (
        <ViewContext.Provider value={context}>
            <Properties onChange={stateUpdater}>
                <DashboardConfigApply />
                <DashboardRenderer />
            </Properties>
        </ViewContext.Provider>
    );
};

export const App: React.FC<DashboardViewProps> = ({ onProperties, children }) => {
    return (
        <CompositionProvider>
            <DashboardView onProperties={onProperties} />
            <DashboardConfig>
                <AddWidget<CardWidget>
                    name="my-widget"
                    type="card"
                    title="My Widget"
                    description="Custom widget that shows current weather."
                    button={<button>Show Weather</button>}
                />
            </DashboardConfig>
            {children}
        </CompositionProvider>
    );
};
