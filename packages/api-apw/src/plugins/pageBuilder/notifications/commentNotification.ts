import { createApwCommentNotification } from "~/ApwCommentNotification";
import { ApwContentTypes } from "~/types";

export const createCommentNotification = () => {
    const plugin = createApwCommentNotification(ApwContentTypes.PAGE, params => {
        const { commentUrl, contentUrl } = params;
        return {
            text: `
                Hi,<br /><br />
                
                You have received a <a href="${commentUrl}">comment</a>, on a change request, for <a href="${contentUrl}">this</a> page.<br /><br />
                
                Here are the full URLs:<br /><br />
        
                Comment: ${commentUrl}<br />
                Page: ${contentUrl}
            `
        };
    });

    plugin.name = `${plugin.type}.${ApwContentTypes.PAGE}.default`;

    return plugin;
};
