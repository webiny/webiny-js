import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { PageElementsProvider } from "./components/PageElementsProvider";

const SpaceX = element => {
    console.log('asd')
    const {x} = usePageElements();
    return <div>spacex</div>;
}

// probat cu samo
const a = <SpaceX/>;

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <AddPageElementRenderer
                type={"spacex"}
                // Ovo je React komponenta ili f-ja koja vrace element?
                component={SpaceX}
            />
            <AddGraphQLQuerySelection />
        </Admin>
    );
};
