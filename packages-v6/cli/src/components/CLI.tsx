import React, { useMemo } from "react";
import { Arguments } from "yargs";
import { Plugin } from "../../../core/src/definePlugin";

interface CLIProps {
  args: Arguments;
  plugins: Plugin[];
  output: string;
}

interface CLIContext {
  args: Arguments;
  plugins: Plugin[];
  output: string;
}

const CLIContext = React.createContext<CLIContext | undefined>(undefined);

export function useCLI() {
  const context = React.useContext(CLIContext);
  if (!context) {
    throw Error(`Missing CLI context provider!`);
  }

  return context;
}

export const CLI: React.FC<CLIProps> = ({ children, ...props }) => {
  const context = useMemo<CLIContext>(() => props, [props]);
  return <CLIContext.Provider value={context}>{children}</CLIContext.Provider>;
};
