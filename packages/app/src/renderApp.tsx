import type { Root } from "react-dom/client";
import ReactDOMClient from "react-dom/client";

export const renderApp = (app: React.JSX.Element): Root => {
    const container = document.getElementById("root")!;

    const root = ReactDOMClient.createRoot(container);
    root.render(app);
    return root;
};
