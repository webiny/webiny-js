import React from "react";
import { Markdown } from "@webiny/admin-ui";

/*
 * Body text, not help text. The shared `Markdown` defaults suit a sentence of field help, and an
 * answer read at that size and colour looked like a footnote.
 *
 * Answers always sit on a tinted surface (the palette's grey block, the panel's insight card), so
 * code is on white to stay apart from it. In a table every row has an id, and a chip on each one
 * turns the column into noise, so cells show code bare and on one line. A table wider than the
 * answer scrolls sideways on its own instead of widening the answer.
 */
const PROSE_CLASSES = [
    "text-md leading-[22px] text-neutral-primary",
    "[&>*]:m-0 [&>*+*]:mt-sm-extra",
    // About 70 characters a line. Tables and code are left full width.
    "[&_p]:max-w-[70ch] [&_p]:text-pretty [&_li]:max-w-[70ch] [&_li]:text-pretty",
    "[&_h3]:text-lg [&_h3]:leading-6 [&_h3]:font-semibold [&_h4]:text-md [&_h4]:font-semibold",
    "[&_ul]:mb-0 [&_ol]:mb-0 [&_li]:mt-0 [&_li+li]:mt-xs",
    "[&_a]:text-accent-primary [&_a]:underline-offset-2",
    "[&_code]:rounded-sm [&_code]:bg-neutral-base [&_code]:px-xs [&_code]:py-px [&_code]:text-[13px]",
    "[&_pre]:mb-0 [&_pre]:rounded-lg [&_pre]:bg-neutral-base [&_pre]:px-md [&_pre]:py-sm-extra [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-5",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:tabular-nums",
    "[&_th]:border-b-sm [&_th]:border-neutral-muted [&_th]:py-xs [&_th]:pr-sm [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-neutral-strong",
    "[&_td]:border-b-sm [&_td]:border-neutral-dimmed [&_td]:py-sm [&_td]:pr-sm [&_td]:align-top",
    "[&_td_code]:whitespace-nowrap [&_td_code]:bg-transparent [&_td_code]:p-0"
].join(" ");

/** An answer's markdown, in the answer prose style. */
export const AiAnswerProse = ({ text }: { text: string }) => (
    <Markdown size="md" className={PROSE_CLASSES}>
        {text}
    </Markdown>
);
