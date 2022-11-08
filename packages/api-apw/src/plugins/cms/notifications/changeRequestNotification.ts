import { ApwContentTypes } from "~/types";
import { createApwChangeRequestNotification } from "~/ApwChangeRequestNotification";

export const createChangeRequestNotification = () => {
    const plugin = createApwChangeRequestNotification(ApwContentTypes.CMS_ENTRY, params => {
        const { changeRequestUrl, contentUrl } = params;

        return {
            text: `
                Hi,<br /><br />
                
                You have received a <a href="${changeRequestUrl}">change request</a>, for <a href="${contentUrl}">this</a> content entry.<br /><br />
                
                Here are the full URLs:<br /><br />
        
                Change Request: ${changeRequestUrl}<br />
                Content Entry: ${contentUrl}
            `
        };
    });

    plugin.name = `${plugin.type}.${ApwContentTypes.CMS_ENTRY}.default`;

    return plugin;
};
