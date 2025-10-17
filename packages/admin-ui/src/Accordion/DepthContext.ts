import { createContext, useContext } from "react";

const DepthContext = createContext<number>(0);

export const DepthProvider = DepthContext.Provider;

export const useDepth = () => {
    return useContext(DepthContext);
};
