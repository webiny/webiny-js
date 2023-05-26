import React from "react";
import {
    Admin,
    DashboardRenderer,
    createComponentPlugin,
    makeComposable,
    CompositionScope
} from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

const MyComposableComponent = makeComposable<{ items?: string[] }>(
    "MyComposableComponent",
    ({ items }) => {
        return (
            <ul>
                {(items || ["default item"]).map(item => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        );
    }
);

const AddItems = ({ items }: { items: string[] }) => {
    const Plugin = createComponentPlugin(MyComposableComponent, Original => {
        return function Items(props) {
            return <Original items={[...(props.items || []), ...items]} />;
        };
    });

    return <Plugin />;
};

const AddPbItems = ({ items }: { items: string[] }) => {
    return (
        <CompositionScope name={"pb"}>
            <AddItems items={items} />
        </CompositionScope>
    );
};

const AddCmsItems = ({ items }: { items: string[] }) => {
    return (
        <CompositionScope name={"cms"}>
            <AddItems items={items} />
        </CompositionScope>
    );
};

const MyDashboard = createComponentPlugin(DashboardRenderer, () => {
    return function Dashboard() {
        return (
            <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
                <div>
                    <MyComposableComponent />
                </div>
                <div>
                    <CompositionScope name={"pb"}>
                        <MyComposableComponent />
                    </CompositionScope>
                </div>
                <div>
                    <CompositionScope name={"cms"}>
                        <MyComposableComponent />
                    </CompositionScope>
                </div>
                <div>
                    <CompositionScope name={"cms"}>
                        <MyComposableComponent />
                    </CompositionScope>
                </div>
            </div>
        );
    };
});

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <MyDashboard />
            {/* Plugins */}
            <AddItems items={["item-1", "item-2"]} />
            <AddPbItems items={["pb-1", "pb-2"]} />
            <AddPbItems items={["pb-3", "pb-4"]} />
            <AddCmsItems items={["cms-1", "cms-2"]} />
        </Admin>
    );
};
