
const headingTags: string[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
const otherTags: string[] = ["paragraph"];

export const editorSupportedTags = (): string[] => {
   return [...headingTags, ...otherTags];
}

export const isHeadingTag = (tag: string): boolean => {
   const tagString = tag.toLowerCase();
   return headingTags.findIndex((tagElem) => tagString === tagElem) > -1;
}

export const isEditorSupportedTag = (tag: string): boolean => {
   const tagString = tag.toLowerCase();
   return editorSupportedTags().findIndex((tagElem) => tagString === tagElem) > -1;
}
