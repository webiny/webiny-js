import ReactDOMClient, { Root } from "react-dom/client";

export const renderApp = (app: JSX.Element): Root => {
    const container = document.getElementById("root")!;

    const root = ReactDOMClient.createRoot(container);
    root.render(app);
    return root;
};
