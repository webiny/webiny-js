import { h } from "vue";
import { contentSdk } from "@webiny/website-builder-sdk";
import { useDocumentFragments } from "~/components/FragmentsProvider.js";
import type { ComponentProps } from "~/types.js";
import type { DocumentFragments } from "~/components/FragmentsProvider.js";
import type { DocumentFragmentConfig } from "~/components/FragmentsProvider.js";

type FragmentProps = ComponentProps<{ name: string }>;

const findFixed = (fragments: DocumentFragments, name: string) =>
    fragments.find(f => f.type === "fixed" && f.name === name) as
        | Extract<DocumentFragmentConfig, { type: "fixed" }>
        | undefined;

const FragmentPlaceholder = (props: { name: string }) => {
    const label = props.name ? h("strong", null, [` ${props.name} `]) : " ";

    return h(
        "div",
        {
            style: {
                display: "flex",
                height: "100px",
                backgroundColor: "#f4f4f4",
                justifyContent: "center",
                alignItems: "center",
                fill: "#ffffff"
            }
        },
        ["This is a placeholder for", label, "content coming from your frontend app."]
    );
};

/**
 * Looks up a named fixed fragment provided by the consumer's DocumentRenderer
 * and renders it in place. Shows a placeholder in editing mode when no
 * matching fragment is found.
 */
export const FragmentComponent = (props: FragmentProps) => {
    const isEditing = contentSdk.isEditing();
    const fragments = useDocumentFragments();
    const fragment = findFixed(fragments, props.inputs?.name);

    if (!fragment && isEditing) {
        return h(FragmentPlaceholder, { name: props.inputs?.name });
    }

    if (fragment) {
        // `element` is a Vue slot function (() => VNode[]) or a VNode.
        if (typeof fragment.element === "function") {
            return h("div", null, fragment.element());
        }
        return fragment.element;
    }

    return null;
};
