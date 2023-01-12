import { createApwCommentNotification } from "~/ApwCommentNotification";
import { ApwContentTypes } from "~/types";

export const createCommentNotification = () => {
    const plugin = createApwCommentNotification(ApwContentTypes.CMS_ENTRY, params => {
        const { commentUrl, contentUrl } = params;

        return {
            text: `
                Hi,<br /><br />
                
                You have received a <a href="${commentUrl}">comment</a>, on a change request, for <a href="${contentUrl}">this</a> content entry.<br />
                
                Here are the full URLs:<br /><br />
        
                Comment: ${commentUrl}<br />
                Content Entry: ${contentUrl}
            `
        };
    });

    plugin.name = `${plugin.type}.${ApwContentTypes.CMS_ENTRY}.default`;

    return plugin;
};
