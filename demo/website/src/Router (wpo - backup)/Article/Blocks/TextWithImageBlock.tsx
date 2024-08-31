import React from "react";
import { GenericBlock, TextWithImageBlock } from "@demo/shared";
import { RichTextLexicalRenderer } from "@webiny/react-rich-text-lexical-renderer";

export const isTextWithImageBlock = (block: GenericBlock): block is TextWithImageBlock => {
    return block.__typename === "Article_Content_Textwithimageblock";
};

export const TextWithImageBlockComponent = ({ block }: { block: TextWithImageBlock }) => {
    return (
        <section className="bg-white dark:bg-gray-900">
            <div className="gap-8 items-center py-8 mx-auto max-w-screen-xl xl:gap-16 md:grid md:grid-cols-2 sm:py-16">
                {block.image ? (
                    <img
                        className="w-full dark:hidden shadow-xl h-auto max-w-full rounded-lg"
                        src={block.image}
                        alt="dashboard image"
                    />
                ) : null}
                {block.image ? (
                    <img
                        className="w-full hidden shadow-xl dark:block h-auto max-w-full rounded-lg"
                        src={block.image}
                        alt="dashboard image"
                    />
                ) : null}
                <div className="mt-4 md:mt-0">
                    <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                        {block.title}
                    </h2>
                    <RichTextLexicalRenderer value={block.content} />
                </div>
            </div>
        </section>
    );
};
