import { DomFactory } from "../utils/toDom";

export const paragraphHtmlTag = `<p>Testing paragraph element</p>`;
export const invalidMarkup = /* HTML */ `<div class="_1z604">
    <figure data-c="inline-image" class="_3kWNL _2YlTE">
        <button type="button" aria-label="Open Gallery" class="_2bgbL">
            <span class="_1cCV2 _3krT7">See all 37 photos</span>
        </button>
    </figure>
</div>`;

export const boldItalicUnderlineFormatHtml = `<p><u><em><strong>formatted text</strong></em></u></p>`;

export const headingH1Html = `<h1>Testing heading h1 element</h1>`;
export const headingH4Html = `<h4>Testing heading h4 element</h4>`;

export const bulletListHtml = `<ul><li>list item 1</li><li>list item 2</li></ul>`;
export const numberedListHtml = `<ol><li>list item 1</li><li>list item 2</li></ol>`;
export const linkHtml = `<p><a href="https://webiny.com" target="_blank" rel="noopener noreferrer">My webiny link</a></p>`;
export const quoteHtml = `<blockquote>My quote block</blockquote>`;
export const codeHtml = `<code>Text code formatting</code>`;

export const imageHtml = `<img src="https://d1mjtaoiepp9z3.cloudfront.net/files/8lf86ndrt-img.svg?width=2500" alt="webiny image">`;

const htmlMocks = {
    paragraphHtmlTag,
    invalidMarkup,
    boldItalicUnderlineFormatHtml,
    headingH1Html,
    headingH4Html,
    bulletListHtml,
    numberedListHtml,
    linkHtml,
    quoteHtml,
    codeHtml,
    imageHtml
};

type MockKeys = keyof typeof htmlMocks;

type Mocks = Record<MockKeys, Document> & { domParser: string };

export const createMocks = (domFactory: DomFactory) => {
    return (Object.keys(htmlMocks) as MockKeys[]).reduce<Mocks>(
        (acc, key) => {
            return { ...acc, [key]: domFactory.parseHtml(htmlMocks[key]) };
        },
        { domParser: domFactory.getName() } as Mocks
    );
};
