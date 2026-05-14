import {
  require_main
} from "./chunk-57FWKJCD.mjs";
import {
  defineConfig
} from "./chunk-66LTAQP7.mjs";
import {
  __toESM,
  init_esm
} from "./chunk-OYSLMRBF.mjs";

// trigger.config.ts
init_esm();
var import_dotenv = __toESM(require_main());
import_dotenv.default.config();
var trigger_config_default = defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "proj_xjpoxxhipietzcijuysv",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 1e4,
      factor: 2,
      randomize: true
    }
  },
  dirs: ["./trigger"],
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
