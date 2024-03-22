import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Layout } from "./Layout";
import { Elements as BaseElements } from "~/editor/config/Elements";
import { Element as BaseElement, ElementProps as BaseElementProps } from "~/editor/config/Element";

const SCOPE = "content";

const BaseContent = makeDecoratable("EditorContent", () => {
    return (
        <Layout>
            <Elements />
        </Layout>
    );
});

export type ElementProps = Omit<BaseElementProps, "scope" | "group">;

const Element = makeDecoratable("ContentElement", (props: ElementProps) => {
    return <BaseElement {...props} scope={SCOPE} />;
});

const Elements = makeDecoratable("ContentElements", () => {
    return <BaseElements scope={SCOPE} />;
});

export const Content = Object.assign(BaseContent, { Layout, Element, Elements });
