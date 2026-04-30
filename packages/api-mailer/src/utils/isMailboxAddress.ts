import emailAddresses from "email-addresses";

/**
 * RFC 5322 mailbox validator. Accepts both addr-spec ("addr@domain") and
 * name-addr ("Display Name <addr@domain>") forms — both are valid SMTP
 * From / Reply-To inputs that nodemailer and most providers accept.
 */
export const isMailboxAddress = (value: string): boolean => {
    return emailAddresses.parseOneAddress(value) !== null;
};
