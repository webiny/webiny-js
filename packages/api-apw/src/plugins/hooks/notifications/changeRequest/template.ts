interface Params {
    url: string;
    contentEntryUrl: string;
}
export const createChangeRequestNotification = (params: Params) => {
    const { url, contentEntryUrl } = params;
    return `
        Hi,
        
        You have received a <a href="${url}">change request</a>, on a content review, for <a href="${contentEntryUrl}">this</a> content entry.
        
        Here are the full URLs:<br /><br />

        Change Request: ${url}<br />
        Content Entry: ${contentEntryUrl}
    `;
};
