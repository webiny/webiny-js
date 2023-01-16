export default (): Promise<string> => {
    return new Promise((resolve: (value: string) => void) => {
        try {
            const xhr = new window.XMLHttpRequest();
            xhr.open("GET", "https://api.ipify.org/?format=json", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send();
            xhr.onload = function () {
                const response = JSON.parse(this.responseText);
                resolve(response.ip);
            };
            xhr.onabort = function () {
                resolve("0.0.0.0");
            };
            xhr.onerror = function () {
                resolve("0.0.0.0");
            };
        } catch (e) {
            resolve("0.0.0.0");
        }
    });
};
