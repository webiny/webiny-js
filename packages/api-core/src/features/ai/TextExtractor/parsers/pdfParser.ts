export async function extractPdfText(buffer: Buffer): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
            .filter(item => "str" in item)
            .map(item => (item as { str: string }).str)
            .join("");
        pages.push(text);
    }

    return pages.join("\n\n");
}
