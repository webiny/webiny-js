import { useContext } from "react";
import { WebsocketsContext } from "~/WebsocketsContextProvider";
import { IWebsocketsContext } from "~/types";

export const useWebsockets = (): IWebsocketsContext => {
    const context = useContext(WebsocketsContext);
    if (!context) {
        throw new Error("useWebsockets must be used within a SocketsProvider");
    }
    return context;
};
