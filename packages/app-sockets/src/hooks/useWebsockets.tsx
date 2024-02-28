import { useContext } from "react";
import { SocketsContext } from "~/SocketsProvider";

export const useWebsockets = () => {
    const context = useContext(SocketsContext);
    if (!context) {
        throw new Error("useWebsockets must be used within a SocketsProvider");
    }
    return context;
};
