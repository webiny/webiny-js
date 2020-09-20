import handlerClient from "./plugins/handlerClient";
import handlerHttp from "./plugins/handlerHttp";
import handlerArgs from "./plugins/handlerArgs";

export default () => [handlerClient, handlerArgs, handlerHttp];
