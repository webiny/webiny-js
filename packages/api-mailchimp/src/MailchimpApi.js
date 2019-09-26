import got from "got";

const MailchimpApi = function({ apiKey }) {
    this.apiKey = apiKey;

    this.isValidApiKey = async () => {
        try {
            await this.get({
                path: `/lists/`
            });
            return true;
        } catch (e) {
            return false;
        }
    };

    this.get = ({ path }) => {
        return this.request({ path, method: "get" });
    };

    this.post = ({ path, body }) => {
        return this.request({ path, body, method: "post" });
    };

    this.request = ({ path, method, body }: Object) => {
        // eslint-disable-next-line
        const [, dataCenter] = this.apiKey.split("-");
        return got(`https://${dataCenter}.api.mailchimp.com/3.0` + path, {
            method,
            json: true,
            body,
            headers: {
                authorization: "apikey " + this.apiKey
            }
        });
    };
};

export default MailchimpApi;
