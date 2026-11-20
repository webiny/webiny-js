import { escapeHtml } from "~/features/notifications/shared/escapeHtml.js";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";
import type { NotificationTransport } from "./abstractions.js";

/** The two bodies of a notification e-mail. */
export interface NotificationMail {
    text: string;
    html: string;
}

/** One row of the details table: a fixed label and a one-line value. */
interface NotificationMailRow {
    label: string;
    value: string;
}

const GREETING = "Hi,";

// Plain inline CSS: e-mail clients ignore style sheets. Neutral greys only.
const TABLE_STYLE = "border-collapse:collapse;margin:16px 0;";
const LABEL_STYLE = "padding:4px 16px 4px 0;color:#6b6b6b;vertical-align:top;";
const VALUE_STYLE = "padding:4px 0;vertical-align:top;";
const BUTTON_STYLE =
    "display:inline-block;padding:10px 16px;border-radius:4px;background:#333333;color:#ffffff;text-decoration:none;";
const FOOTER_STYLE = "color:#6b6b6b;font-size:12px;";

const getRows = (details: NotificationTransport.MessageDetails): NotificationMailRow[] => {
    const contentTitle = toSingleLine(details.contentTitle);
    const contentType = details.contentType === null ? "" : toSingleLine(details.contentType);
    return [
        {
            label: "Content",
            value: contentType === "" ? contentTitle : `${contentType} · ${contentTitle}`
        },
        {
            label: "Step",
            value: `${details.stepNumber} of ${details.stepCount} · ${toSingleLine(details.stepTitle)}`
        },
        { label: "Requested by", value: toSingleLine(details.requester) }
    ];
};

/**
 * The text and HTML bodies of a notification e-mail (D153): a greeting, the message, the details
 * table, the link as a button and the footer. Every value in the HTML goes through `escapeHtml`;
 * the text part mirrors the HTML as lines. Parts the message does not carry are left out. Pure.
 */
export const renderNotificationMail = (
    message: NotificationTransport.Message
): NotificationMail => {
    const rows = message.details ? getRows(message.details) : [];
    const footer = message.footer?.trim() ?? "";

    const textParts: string[] = [GREETING, message.body];
    const htmlParts: string[] = [
        `<p>${escapeHtml(GREETING)}</p>`,
        `<p>${escapeHtml(message.body).replace(/\n/g, "<br/>")}</p>`
    ];

    if (rows.length > 0) {
        textParts.push(rows.map(row => `${row.label}: ${row.value}`).join("\n"));
        const htmlRows = rows.map(row => {
            return `<tr><td style="${LABEL_STYLE}">${escapeHtml(row.label)}</td><td style="${VALUE_STYLE}">${escapeHtml(row.value)}</td></tr>`;
        });
        htmlParts.push(
            `<table role="presentation" style="${TABLE_STYLE}">${htmlRows.join("")}</table>`
        );
    }

    if (message.url !== null) {
        textParts.push(`${message.linkLabel}: ${message.url}`);
        htmlParts.push(
            `<p><a href="${escapeHtml(message.url)}" style="${BUTTON_STYLE}">${escapeHtml(message.linkLabel)}</a></p>`
        );
    }

    if (footer !== "") {
        textParts.push(footer);
        htmlParts.push(`<p style="${FOOTER_STYLE}">${escapeHtml(footer)}</p>`);
    }

    return { text: textParts.join("\n\n"), html: htmlParts.join("") };
};
