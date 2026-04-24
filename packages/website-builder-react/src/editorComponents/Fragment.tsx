import React from "react";
import { contentSdk } from "@webiny/website-builder-sdk";
import { useDocumentFragments } from "~/components/FragmentsProvider.js";
import type { ComponentProps } from "~/types.js";
import type { DocumentFragments } from "~/components/FragmentsProvider.js";

type FragmentComponentProps = ComponentProps<{
    name: string;
}>;

const findFixedFragmentByName = (fragments: DocumentFragments, name: string) => {
    return fragments
        .filter(fragment => fragment.type === "fixed")
        .find(fragment => fragment.name === name);
};

export const FragmentComponent = ({ inputs }: FragmentComponentProps) => {
    const isEditing = contentSdk.isEditing();
    const fragments = useDocumentFragments();
    const fragment = findFixedFragmentByName(fragments, inputs.name);

    if (!fragment && isEditing) {
        return <FragmentPlaceholder name={inputs.name} />;
    }

    if (fragment) {
        return <>{fragment.element}</>;
    }

    return null;
};

const FragmentPlaceholder = ({ name }: { name: string }) => {
    const fragmentName = name ? (
        <>
            &nbsp;<strong>{name}</strong>&nbsp;
        </>
    ) : (
        <>&nbsp;</>
    );
    return (
        <div
            style={{
                display: "flex",
                height: "100px",
                backgroundColor: "#f4f4f4",
                justifyContent: "center",
                alignItems: "center",
                fill: "#ffffff"
            }}
        >
            This is a placeholder for{fragmentName}content coming from your frontend app.
        </div>
    );
};
