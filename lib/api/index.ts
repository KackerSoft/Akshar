import { assetsApi } from "./assets";
import { authApi } from "./auth";
import { generationsApi } from "./generations";
import { templatesApi } from "./templates";

export { request, type FieldErrors } from "./client";

export const API = {
  auth: authApi,
  templates: templatesApi,
  assets: assetsApi,
  generations: generationsApi,
};
