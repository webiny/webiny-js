import emailAddresses from "email-addresses";

export interface Mailbox {
    address: string;
    name?: string;
}

/**
 * Splits "Display Name <addr@domain>" into the address and the name, for transports whose API
 * takes them as separate fields. A bare "addr@domain" has no name. Null when the value is not a
 * mailbox address.
 */
export const parseMailbox = (value: string): Mailbox | null => {
    const parsed = emailAddresses.parseOneAddress(value);
    if (!parsed || parsed.type !== "mailbox") {
        return null;
    }

    return {
        address: parsed.address,
        name: parsed.name || undefined
    };
};
