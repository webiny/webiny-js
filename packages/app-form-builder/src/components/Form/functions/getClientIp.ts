export default (): Promise<string> => {
    return new Promise((resolve: (value: string) => void, reject: (error: string) => void) => {
        const xhr = new window.XMLHttpRequest();
        xhr.open("GET", "https://api.ipify.org/?format=json", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
        xhr.onload = function () {
            try {
                const response = JSON.parse(this.responseText);
                resolve(response.ip);
            } catch (e) {
                reject("");
            }
        };
    });
};
