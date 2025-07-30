"use server";
import path from "path";
import { CSSInliner } from "~/CssInliner";

export async function useCss(cssFile?: string) {
    const entryCss = cssFile ?? path.resolve(process.cwd(), "src/theme/theme.css");

    const inliner = new CSSInliner();
    return await inliner.load(entryCss);
}
