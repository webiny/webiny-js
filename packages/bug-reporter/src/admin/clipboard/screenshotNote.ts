/*
 * Images cannot share a clipboard write with the text, so the copy says how many were left behind.
 */
export function screenshotNote(count: number): string {
    return `${count} screenshot(s) attached in the dialog. They cannot be copied with the text, so paste them in alongside it.`;
}
