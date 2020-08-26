import { handleError } from "./utils/error";
import { initApp } from "./app";

initApp().catch(handleError);
