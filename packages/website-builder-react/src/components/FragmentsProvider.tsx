"use client";
import React, { useEffect } from "react";
import { useContentClient } from "./useContentClient.js";

type FragmentConfig =
    | {
          type: "fixed";
          name: string;
          element: React.ReactNode;
      }
    | { type: "component"; component: string; inputs: Record<string, any> };

export type DocumentFragments = FragmentConfig[];

const FragmentsContext = React.createContext<DocumentFragments | undefined>(undefined);

interface FragmentsProviderProps {
    fragments: DocumentFragments;
    children: React.ReactNode;
}

export const FragmentsProvider = ({ fragments, children }: FragmentsProviderProps) => {
    const client = useContentClient();

    useEffect(() => {
        if (client.isEditing()) {
            // Extract serializable data
            const fragmentsData = fragments.map(fragment => {
                if (fragment.type === "fixed") {
                    return {
                        type: "fixed",
                        name: fragment.name
                    };
                }

                return {
                    type: "component",
                    component: fragment.component,
                    inputs: fragment.inputs
                };
            });

            client
                .getEditingSdk()!
                .messenger.send("document.fragments", { fragments: fragmentsData });
        }
    }, [fragments.length]);

    return <FragmentsContext.Provider value={fragments}>{children}</FragmentsContext.Provider>;
};

export const useDocumentFragments = () => {
    const context = React.useContext(FragmentsContext);
    if (!context) {
        return [];
    }

    return context;
};
