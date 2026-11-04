/**
 * Hands a value to the user as a JSON file.
 *
 * Nothing is uploaded anywhere. The report leaves the browser only when the person chooses to send
 * it, which is the moment they decide this data may leave their organisation.
 */
export const downloadJson = (fileName: string, value: unknown): void => {
    const json = JSON.stringify(value, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
};
