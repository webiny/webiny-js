import React from "react";
import { Alert } from "@webiny/ui/Alert";
import { Admin, createDecorator } from "@webiny/app-serverless-cms";
import { useParentField, RenderFieldElement } from "@webiny/app-headless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

const ConditionalRendering = createDecorator(RenderFieldElement, Original => {
    return function ConditionalRender(props) {
        const parent = useParentField();

        if (!parent || !parent.value) {
            return null;
        }

        if (props.field.fieldId === "book" && parent.value.type === "private") {
            return (
                <>
                    <Alert type={"warning"} title="Important!">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a leo eu quam
                        bibendum dapibus. Integer iaculis, ex a molestie commodo, arcu ex egestas
                        sapien, non maximus augue arcu eget arcu. Aliquam nunc est, porttitor sed
                        elementum at, venenatis at nisi. Nullam nec imperdiet purus, eu hendrerit
                        urna. Donec eget tellus lectus. Integer ut ultrices tellus. Sed iaculis
                        lectus mauris, ac ullamcorper lorem dictum ut.
                    </Alert>
                    {/*<Original {...props} />*/}
                </>
            );
        }

        return <Original {...props} />;
    };
});

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <ConditionalRendering />
        </Admin>
    );
};
