export default () =>
    new Promise((resolve, reject) => {
        const xhr = new window.XMLHttpRequest();
        xhr.open("GET", "https://api.ipify.org/?format=json", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
        xhr.onload = function() {
            try {
                const response = JSON.parse(this.responseText);
                resolve(response.ip);
            } catch (e) {
                reject("");
            }
        };
    });
