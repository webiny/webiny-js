import { useContext } from "react";
import { DrawersContext } from "./DrawersContext.js";

export const useDrawers = () => {
    const context = useContext(DrawersContext);

    if (!context) {
        throw new Error("useDrawers must be used within a DrawersContext.Provider");
    }

    return context;
};
