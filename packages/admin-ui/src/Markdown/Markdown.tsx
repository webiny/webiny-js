import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { Text, type TextProps } from "~/Text/index.js";
import { useAdminUi } from "~/AdminUiProvider/index.js";

/**
 * Styling for compiled markdown BLOCKS.
 *
 * Tailwind's preflight strips list markers and paragraph margins, and the markdown compiler emits
 * bare elements, so without this a list renders as unindented run-on text and a fenced code block as
 * plain prose. Child selectors rather than a global stylesheet, so this reaches only markdown that
 * was asked to be styled.
 *
 * Exported for a caller that needs the classes without this component, e.g. one already rendering
 * compiled markdown inside its own element.
 */
export const markdownBlockClasses = [
    "[&_p]:mb-xs [&_p:last-child]:mb-0",
    "[&_ul]:mb-xs [&_ul]:list-disc [&_ul]:pl-lg",
    "[&_ol]:mb-xs [&_ol]:list-decimal [&_ol]:pl-lg",
    "[&_li]:mt-xxs",
    "[&_strong]:font-semibold",
    "[&_a]:underline",
    "[&_code]:rounded [&_code]:bg-neutral-subtle [&_code]:px-xs [&_code]:font-mono",
    "[&_pre]:mb-xs [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-neutral-subtle [&_pre]:p-sm"
].join(" ");

export interface MarkdownProps extends Pick<TextProps, "size" | "className"> {
    children: React.ReactNode;
}

/**
 * Renders markdown that contains block content: paragraphs, lists, fenced code.
 *
 * `Alert`, `Label` and the form-field descriptions call `compileMarkdown` directly and need none of
 * this, because they render a sentence with a bold word or a link. Reach for this component when the
 * source is long-form and its structure has to survive.
 *
 * Renders a `div`, since `Text` is a span by default and block markdown nested in one is invalid.
 */
const MarkdownBase = ({ children, size = "sm", className }: MarkdownProps) => {
    const { compileMarkdown } = useAdminUi();

    return (
        <Text as="div" size={size} className={cn(markdownBlockClasses, className)}>
            {compileMarkdown(children)}
        </Text>
    );
};

const Markdown = makeDecoratable("Markdown", MarkdownBase);

export { Markdown };
