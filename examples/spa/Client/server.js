import { spa } from "webiny-scripts";

export default spa.server({
    domain: "http://localhost",
    port: 8060,
    routes: {
        "/admin": "admin.html",
        "/": "frontend.html"
    }
});
