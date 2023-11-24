// @ts-expect-error jsdom types are messing up with the repo, so they're disabled in the root package.json.
import jsdom from "jsdom";

interface HtmlToDom {
    (html: string): Document;
}

export class DomFactory {
    private readonly name: string;
    private readonly factory: HtmlToDom;

    constructor(name: string, factory: HtmlToDom) {
        this.factory = factory;
        this.name = name;
    }

    getName() {
        return this.name;
    }

    parseHtml(html: string) {
        return this.factory(html);
    }
}

export const toJsDom = new DomFactory("JSDOM", html => {
    const dom = new jsdom.JSDOM(html);
    return dom.window.document;
});

export const toBrowserDom = new DomFactory("DOMParser", html => {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
});
