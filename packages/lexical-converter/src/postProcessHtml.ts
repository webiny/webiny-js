import * as cheerio from "cheerio";

export const postProcessHtml = (html: string) => {
    const $ = cheerio.load(html);

    // Replace <b> elements with their text content (unwrap them)
    $("b").each((_, el) => {
        $(el).replaceWith($(el).html() ?? "");
    });

    return $('body').html() ?? html;
};
