#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";

// src/cli/config-loader.ts
import { existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createJiti } from "jiti";

// src/cli/errors.ts
var TestDinoError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TestDinoError";
    Error.captureStackTrace(this, this.constructor);
  }
};
var TokenMissingError = class extends TestDinoError {
  constructor() {
    const message = `Token is required to run tests with TestDino

Provide token via:
  \u2022 CLI flag:    npx tdpw test --token <your-token>
  \u2022 Environment: export TESTDINO_TOKEN=<your-token>
  \u2022 Config file: Create testdino.config.ts with token

Get your token at: https://testdino.com/settings`;
    super(message);
    this.name = "TokenMissingError";
  }
};
var ConfigSyntaxError = class extends TestDinoError {
  constructor(configPath, originalError) {
    const message = `Failed to load ${configPath}

${originalError.message}

Fix the syntax error and try again.`;
    super(message);
    this.name = "ConfigSyntaxError";
  }
};
var InvalidServerUrlError = class extends TestDinoError {
  constructor(url) {
    const message = `Invalid server URL: ${url}

Server URL must be a valid HTTP or HTTPS URL.

Examples:
  \u2022 https://reporter.testdino.com
  \u2022 https://api-v0.testdino.com
  \u2022 https://global.testdino.com`;
    super(message);
    this.name = "InvalidServerUrlError";
  }
};

// src/cli/config-loader.ts
var CONFIG_FILENAMES = ["testdino.config.ts", "testdino.config.js"];
var ConfigLoader = class {
  cwd;
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }
  async load() {
    const configPath = this.findConfigFile();
    if (!configPath) {
      return { config: {} };
    }
    try {
      const config = await this.loadConfigFile(configPath);
      return { config, configPath };
    } catch (error) {
      throw new ConfigSyntaxError(configPath, error instanceof Error ? error : new Error(String(error)));
    }
  }
  findConfigFile() {
    let currentDir = this.cwd;
    while (true) {
      for (const filename of CONFIG_FILENAMES) {
        const configPath = join(currentDir, filename);
        if (existsSync(configPath)) {
          return configPath;
        }
      }
      const gitDir = join(currentDir, ".git");
      if (existsSync(gitDir) && statSync(gitDir).isDirectory()) {
        break;
      }
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }
    return void 0;
  }
  async loadConfigFile(configPath) {
    const jitiLoader = createJiti(dirname(configPath), {
      interopDefault: true,
      fsCache: false,
      extensions: [".ts", ".js"]
    });
    let loaded;
    try {
      const resolved = jitiLoader.esmResolve(configPath, { try: true });
      if (!resolved) {
        throw new Error(`Could not resolve config file: ${configPath}`);
      }
      const resolvedPath = typeof resolved === "string" ? resolved : fileURLToPath(resolved);
      loaded = await jitiLoader.import(resolvedPath);
    } catch (error) {
      throw new Error(`Syntax error: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    let config;
    if (loaded && typeof loaded === "object" && "__esModule" in loaded) {
      config = loaded.default;
    } else if (loaded && typeof loaded === "object" && "default" in loaded) {
      config = loaded.default;
    } else {
      config = loaded;
    }
    if (config === null || config === void 0) {
      return {};
    }
    if (typeof config === "function") {
      try {
        config = config();
      } catch (error) {
        throw new Error(`Error executing config function: ${error instanceof Error ? error.message : String(error)}`, {
          cause: error
        });
      }
      if (config instanceof Promise) {
        throw new Error("Async config functions are not supported");
      }
      if (config === null || config === void 0) {
        return {};
      }
    }
    if (config && typeof config !== "object") {
      throw new Error("Config must be an object");
    }
    return config ?? {};
  }
};

// src/cli/config-detector.ts
import { existsSync as existsSync2 } from "fs";
import { join as join2, dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createJiti as createJiti2 } from "jiti";
var PLAYWRIGHT_CONFIG_FILENAMES = ["playwright.config.ts", "playwright.config.js"];
var TESTDINO_REPORTER_NAMES = ["@testdino/playwright", "testdino-playwright", "TestdinoReporter"];
function isValidThreshold(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
var ConfigDetector = class {
  cwd;
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }
  async detect() {
    const configPath = this.findPlaywrightConfig();
    if (!configPath) {
      return { hasReporter: false };
    }
    try {
      const config = await this.loadPlaywrightConfig(configPath);
      const result = this.extractTestdinoReporter(config);
      return {
        ...result,
        configPath
      };
    } catch (error) {
      throw new ConfigSyntaxError(configPath, error instanceof Error ? error : new Error(String(error)));
    }
  }
  findPlaywrightConfig() {
    for (const filename of PLAYWRIGHT_CONFIG_FILENAMES) {
      const configPath = join2(this.cwd, filename);
      if (existsSync2(configPath)) {
        return configPath;
      }
    }
    return void 0;
  }
  async loadPlaywrightConfig(configPath) {
    const jitiLoader = createJiti2(dirname2(configPath), {
      interopDefault: true,
      fsCache: false,
      extensions: [".ts", ".js"]
    });
    let loaded;
    try {
      const resolved = jitiLoader.esmResolve(configPath, { try: true });
      if (!resolved) {
        throw new Error(`Could not resolve Playwright config: ${configPath}`);
      }
      const resolvedPath = typeof resolved === "string" ? resolved : fileURLToPath2(resolved);
      loaded = await jitiLoader.import(resolvedPath);
    } catch (error) {
      throw new Error(`Syntax error: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    let config;
    if (loaded && typeof loaded === "object" && "__esModule" in loaded) {
      config = loaded.default;
    } else if (loaded && typeof loaded === "object" && "default" in loaded) {
      config = loaded.default;
    } else {
      config = loaded;
    }
    if (typeof config === "function") {
      try {
        config = config();
      } catch (error) {
        throw new Error(`Error executing config function: ${error instanceof Error ? error.message : String(error)}`, {
          cause: error
        });
      }
    }
    if (!config || typeof config !== "object") {
      throw new Error("Playwright config must be an object");
    }
    return config;
  }
  extractTestdinoReporter(config) {
    const { reporter } = config;
    if (!reporter) {
      return { hasReporter: false };
    }
    if (typeof reporter === "string") {
      if (this.isTestdinoReporter(reporter)) {
        return { hasReporter: true, options: {} };
      }
      return { hasReporter: false };
    }
    if (Array.isArray(reporter) && reporter.length > 0) {
      if (typeof reporter[0] === "string") {
        const [name, options] = reporter;
        if (this.isTestdinoReporter(name)) {
          return {
            hasReporter: true,
            options: this.extractOptions(options)
          };
        }
        if (!Array.isArray(reporter[1])) {
          return { hasReporter: false };
        }
      }
      for (const item of reporter) {
        if (typeof item === "string") {
          if (this.isTestdinoReporter(item)) {
            return { hasReporter: true, options: {} };
          }
        } else if (Array.isArray(item) && item.length > 0) {
          const [name, options] = item;
          if (this.isTestdinoReporter(name)) {
            return {
              hasReporter: true,
              options: this.extractOptions(options)
            };
          }
        }
      }
    }
    return { hasReporter: false };
  }
  isTestdinoReporter(name) {
    return TESTDINO_REPORTER_NAMES.some((testdinoName) => name === testdinoName || name.includes(testdinoName));
  }
  extractOptions(options) {
    if (!options || typeof options !== "object") {
      return {};
    }
    const config = {};
    if ("token" in options && typeof options.token === "string") {
      config.token = options.token;
    }
    if ("serverUrl" in options && typeof options.serverUrl === "string") {
      config.serverUrl = options.serverUrl;
    }
    if ("ciRunId" in options && typeof options.ciRunId === "string") {
      config.ciRunId = options.ciRunId;
    }
    if ("debug" in options && typeof options.debug === "boolean") {
      config.debug = options.debug;
    }
    if ("coverage" in options && typeof options.coverage === "object" && options.coverage !== null) {
      config.coverage = this.extractCoverageConfig(options.coverage);
    }
    return config;
  }
  extractCoverageConfig(raw) {
    const config = {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : false
    };
    if (Array.isArray(raw.include)) {
      config.include = raw.include.filter((p) => typeof p === "string");
    }
    if (Array.isArray(raw.exclude)) {
      config.exclude = raw.exclude.filter((p) => typeof p === "string");
    }
    if (typeof raw.thresholds === "object" && raw.thresholds !== null) {
      const t = raw.thresholds;
      config.thresholds = {};
      if (isValidThreshold(t.statements)) config.thresholds.statements = t.statements;
      if (isValidThreshold(t.branches)) config.thresholds.branches = t.branches;
      if (isValidThreshold(t.functions)) config.thresholds.functions = t.functions;
      if (isValidThreshold(t.lines)) config.thresholds.lines = t.lines;
    }
    return config;
  }
};

// src/cli/config-merger.ts
import { randomUUID } from "crypto";

// src/types/index.ts
var DEFAULT_SERVER_URL = "https://reporter.testdino.com";

// src/cli/config-merger.ts
var ConfigMerger = class {
  merge(sources) {
    const { env = {}, playwrightConfig = {}, testdinoConfig = {}, cliOptions = {} } = sources;
    const token = this.selectValue(cliOptions.token, testdinoConfig.token, playwrightConfig.token, env.token);
    const serverUrl = this.selectValue(cliOptions.serverUrl, testdinoConfig.serverUrl, playwrightConfig.serverUrl, env.serverUrl) || DEFAULT_SERVER_URL;
    const ciRunId = this.selectValue(cliOptions.ciRunId, testdinoConfig.ciRunId, playwrightConfig.ciRunId, env.ciRunId) || this.generateCiRunId();
    const debug = this.selectValue(cliOptions.debug, testdinoConfig.debug, playwrightConfig.debug, env.debug) ?? false;
    const artifacts = cliOptions.artifacts !== void 0 ? cliOptions.artifacts : this.selectValue(testdinoConfig.artifacts, playwrightConfig.artifacts) ?? true;
    const coverage = this.mergeCoverageConfig(cliOptions.coverage, testdinoConfig.coverage, playwrightConfig.coverage);
    const tags = this.normalizeTags(cliOptions.tags) ?? this.normalizeTags(testdinoConfig.tags) ?? this.normalizeTags(playwrightConfig.tags) ?? this.normalizeTags(env.tags);
    const mergedConfig = {
      token,
      serverUrl,
      ciRunId,
      debug,
      artifacts,
      ...coverage ? { coverage } : {},
      ...tags ? { tags } : {}
    };
    this.validate(mergedConfig);
    return mergedConfig;
  }
  mergeCoverageConfig(cliCoverage, testdinoCoverage, playwrightCoverage) {
    const baseConfig = testdinoCoverage ?? playwrightCoverage;
    if (!baseConfig && cliCoverage === void 0) return void 0;
    if (cliCoverage !== void 0) {
      return { ...baseConfig || { enabled: false }, enabled: cliCoverage };
    }
    return baseConfig;
  }
  // A blank string is treated as absent, not as a value. Otherwise a higher-priority
  // `--server-url ""` masks a valid lower-priority serverUrl and silently routes the
  // run to the built-in default instead of the server the user configured.
  selectValue(...values) {
    return values.find(
      (value) => value !== void 0 && value !== null && !(typeof value === "string" && value.trim() === "")
    );
  }
  normalizeTags(input) {
    if (input === void 0 || input === null) return void 0;
    const raw = typeof input === "string" ? input.split(",") : input;
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const item of raw) {
      if (typeof item !== "string") continue;
      const t = item.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out.length > 0 ? out : void 0;
  }
  generateCiRunId() {
    return `run-${randomUUID()}`;
  }
  validate(config) {
    if (!config.token || typeof config.token !== "string" || config.token.trim().length === 0) {
      throw new TokenMissingError();
    }
    if (config.serverUrl) {
      if (typeof config.serverUrl !== "string" || !this.isValidUrl(config.serverUrl)) {
        throw new InvalidServerUrlError(config.serverUrl);
      }
    }
  }
  isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
  static getEnvConfig() {
    const config = {};
    if (process.env.TESTDINO_TOKEN) {
      config.token = process.env.TESTDINO_TOKEN;
    }
    if (process.env.TESTDINO_SERVER_URL) {
      config.serverUrl = process.env.TESTDINO_SERVER_URL;
    }
    if (process.env.TESTDINO_CI_RUN_ID) {
      config.ciRunId = process.env.TESTDINO_CI_RUN_ID;
    }
    if (process.env.TESTDINO_DEBUG) {
      config.debug = process.env.TESTDINO_DEBUG === "true" || process.env.TESTDINO_DEBUG === "1";
    }
    if (process.env.TESTDINO_TAGS) {
      config.tags = process.env.TESTDINO_TAGS.split(",");
    }
    return config;
  }
};

// src/cli/arg-filter.ts
var TESTDINO_FLAGS = ["--token", "-t", "--ci-run-id", "--server-url", "--debug", "--no-artifacts", "--coverage"];
var FLAGS_WITH_VALUES = ["--token", "-t", "--ci-run-id", "--server-url"];
var ArgFilter = class {
  filter(args) {
    const result = [];
    let skipNext = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (skipNext) {
        skipNext = false;
        continue;
      }
      if (this.isTestdinoFlag(arg)) {
        if (this.isFlagWithValue(arg) && !arg.includes("=")) {
          skipNext = true;
        }
        continue;
      }
      result.push(arg);
    }
    return result;
  }
  isTestdinoFlag(arg) {
    const flagName = arg.split("=")[0];
    return TESTDINO_FLAGS.includes(flagName);
  }
  isFlagWithValue(arg) {
    const flagName = arg.split("=")[0];
    return FLAGS_WITH_VALUES.includes(flagName);
  }
  static getTestdinoFlags() {
    return [...TESTDINO_FLAGS];
  }
};

// src/cli/temp-config.ts
import { writeFileSync, unlinkSync, existsSync as existsSync3 } from "fs";
import { join as join4 } from "path";
import { tmpdir } from "os";
import { randomUUID as randomUUID2 } from "crypto";

// src/utils/ui.ts
import chalk from "chalk";
function supportsColor() {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout.isTTY);
}
var colors = {
  success: (text) => supportsColor() ? chalk.green(text) : text,
  error: (text) => supportsColor() ? chalk.red(text) : text,
  warning: (text) => supportsColor() ? chalk.yellow(text) : text,
  info: (text) => supportsColor() ? chalk.cyan(text) : text,
  bold: (text) => supportsColor() ? chalk.bold(text) : text,
  dim: (text) => supportsColor() ? chalk.dim(text) : text,
  white: (text) => supportsColor() ? chalk.white(text) : text,
  gray: (text) => supportsColor() ? chalk.gray(text) : text,
  blue: (text) => supportsColor() ? chalk.blue(text) : text,
  url: (text) => supportsColor() ? chalk.blue.underline(text) : text
};
var symbols = {
  success: "\u2713",
  // ✓
  error: "\u2716",
  // ✖
  warning: "!",
  info: "i",
  debug: "[debug]",
  bullet: "\u2022",
  // •
  pointer: "\u276F",
  // ❯
  line: "\u2500"
  // ─
};
var ESC = String.fromCharCode(27);
var ANSI_PATTERN = `${ESC}\\[[0-9;]*[a-zA-Z]`;
var ANSI_GLOBAL = new RegExp(ANSI_PATTERN, "g");
var ANSI_SEQUENCE = new RegExp(`^${ANSI_PATTERN}`);
function stripAnsi(str) {
  return str.replace(ANSI_GLOBAL, "");
}
function box(content, options = {}) {
  if (content.length === 0 && !options.title) return "";
  const { padding = 1, borderColor = "white", title } = options;
  const maxContentWidth = Math.max(
    0,
    ...content.map((line) => stripAnsi(line).length),
    title ? stripAnsi(title).length : 0
  );
  const boxWidth = maxContentWidth + padding * 2 + 2;
  const colorFn = borderColor === "green" ? colors.success : borderColor === "red" ? colors.error : borderColor === "yellow" ? colors.warning : borderColor === "cyan" ? colors.info : colors.white;
  const lines = [];
  if (title) {
    const titleText = ` ${title} `;
    const remainingWidth = boxWidth - 2 - titleText.length;
    const leftPad = Math.floor(remainingWidth / 2);
    const rightPad = remainingWidth - leftPad;
    lines.push(
      colorFn("\u250C") + colorFn("\u2500".repeat(leftPad)) + colors.bold(titleText) + colorFn("\u2500".repeat(rightPad)) + colorFn("\u2510")
    );
  } else {
    lines.push(colorFn("\u250C") + colorFn("\u2500".repeat(boxWidth - 2)) + colorFn("\u2510"));
  }
  if (padding > 0) {
    lines.push(colorFn("\u2502") + " ".repeat(boxWidth - 2) + colorFn("\u2502"));
  }
  for (const line of content) {
    const lineLength = stripAnsi(line).length;
    const rightSpace = boxWidth - 2 - padding - lineLength - padding;
    lines.push(
      colorFn("\u2502") + " ".repeat(padding) + line + " ".repeat(Math.max(0, rightSpace + padding)) + colorFn("\u2502")
    );
  }
  if (padding > 0) {
    lines.push(colorFn("\u2502") + " ".repeat(boxWidth - 2) + colorFn("\u2502"));
  }
  lines.push(colorFn("\u2514") + colorFn("\u2500".repeat(boxWidth - 2)) + colorFn("\u2518"));
  return lines.join("\n");
}

// src/utils/update-notifier.ts
import axios from "axios";
import { readFileSync } from "fs";
import { dirname as dirname3, join as join3 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var REGISTRY_URL = "https://registry.npmjs.org/@testdino/playwright/latest";
var CHECK_TIMEOUT_MS = 1500;
var CHANGELOG_URL = "https://changelog.testdino.com/?type=cli";
var PACKAGE_NAME = "@testdino/playwright";
var UNRESOLVED_VERSION = "0.0.0";
function buildUpdateNoticeLines(currentVersion, latestVersion) {
  const label = (text) => colors.dim(text.padEnd("Current:".length));
  return [
    `A new version of ${colors.info(PACKAGE_NAME)} is available`,
    "",
    `${label("Current:")} ${colors.error(currentVersion)}`,
    `${label("Latest:")} ${colors.success(latestVersion)}`,
    "",
    "Update with:",
    `npm install --save-dev ${PACKAGE_NAME}@latest`,
    "",
    `Release notes: ${colors.url(CHANGELOG_URL)}`
  ];
}
function getModuleDir() {
  const metaUrl = typeof import.meta === "object" ? import.meta?.url : void 0;
  if (metaUrl) return dirname3(fileURLToPath3(metaUrl));
  return __dirname;
}
function getPackageVersion() {
  const candidates = ["../package.json", "../../package.json"];
  for (const candidate of candidates) {
    try {
      const raw = readFileSync(join3(getModuleDir(), candidate), "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.name === "@testdino/playwright" && typeof parsed.version === "string") {
        return parsed.version;
      }
    } catch {
      continue;
    }
  }
  return UNRESOLVED_VERSION;
}
function compareVersions(a, b) {
  const parse = (v) => v.replace(/^v/, "").split("+")[0].split("-")[0].split(".").map((part) => Number.parseInt(part, 10));
  const left = parse(a);
  const right = parse(b);
  if (left.some(Number.isNaN) || right.some(Number.isNaN)) return 0;
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}
function isPrerelease(version) {
  return version.includes("-");
}
async function fetchLatestVersion() {
  try {
    const response = await axios.get(REGISTRY_URL, {
      timeout: CHECK_TIMEOUT_MS,
      headers: { Accept: "application/vnd.npm.install-v1+json" }
    });
    const version = response.data?.version;
    return typeof version === "string" ? version : void 0;
  } catch {
    return void 0;
  }
}
async function checkForUpdate(currentVersion) {
  if (currentVersion === UNRESOLVED_VERSION) return void 0;
  if (isPrerelease(currentVersion)) return void 0;
  const latest = await fetchLatestVersion();
  if (!latest || isPrerelease(latest)) return void 0;
  return compareVersions(latest, currentVersion) > 0 ? latest : void 0;
}
var SETTLE_GRACE_MS = 150;
async function awaitUpdateResult(pending) {
  let timer;
  const grace = new Promise((resolve) => {
    timer = setTimeout(() => resolve(void 0), SETTLE_GRACE_MS);
    timer.unref?.();
  });
  try {
    return await Promise.race([pending.catch(() => void 0), grace]);
  } finally {
    clearTimeout(timer);
  }
}

// src/cli/logger.ts
var Logger = class {
  debugEnabled;
  constructor(debugEnabled = false) {
    this.debugEnabled = debugEnabled;
  }
  setDebug(enabled) {
    this.debugEnabled = enabled;
  }
  error(message, error) {
    console.error(`  ${colors.error(symbols.error)} ${colors.error(message)}`);
    if (error && this.debugEnabled) {
      console.error(colors.dim(`  Stack trace:
${error.stack || error.message}`));
    }
  }
  warn(message) {
    console.warn(`  ${colors.warning(symbols.warning)} ${colors.warning(message)}`);
  }
  info(message) {
    console.log(`  ${colors.info(symbols.info)} ${message}`);
  }
  success(message) {
    console.log(`  ${colors.success(symbols.success)} ${message}`);
  }
  debug(message) {
    if (this.debugEnabled) {
      console.log(`  ${colors.dim(symbols.debug)} ${colors.dim(message)}`);
    }
  }
  newline() {
    console.log();
  }
  section(title) {
    console.log(`
${colors.bold(title)}`);
  }
  listItem(text) {
    console.log(`  ${colors.dim(symbols.bullet)} ${text}`);
  }
  code(text) {
    console.log(colors.gray(`  ${text}`));
  }
  formatError(error) {
    if (this.debugEnabled && error.stack) {
      return error.stack;
    }
    return error.message;
  }
  banner(version) {
    console.log(
      box([`TestDino Playwright v${version}`, colors.dim("https://testdino.com")], {
        borderColor: "cyan"
      })
    );
    console.log();
  }
  updateNotice(currentVersion, latestVersion) {
    console.log(box(buildUpdateNoticeLines(currentVersion, latestVersion), { borderColor: "white" }));
    console.log();
  }
};

// src/cli/temp-config.ts
var TempConfigManager = class {
  tempFiles = /* @__PURE__ */ new Set();
  cleanupHandlersRegistered = false;
  exitHandler;
  sigintHandler;
  sigtermHandler;
  uncaughtExceptionHandler;
  unhandledRejectionHandler;
  logger;
  constructor(logger2) {
    this.logger = logger2 ?? new Logger();
  }
  create(config) {
    const tempPath = this.generateTempPath();
    try {
      const configJson = JSON.stringify(config, null, 2);
      writeFileSync(tempPath, configJson, "utf-8");
      this.tempFiles.add(tempPath);
      if (!this.cleanupHandlersRegistered) {
        this.registerCleanupHandlers();
        this.cleanupHandlersRegistered = true;
      }
      return {
        path: tempPath,
        config
      };
    } catch (error) {
      throw new Error(
        `Failed to create temp config file: ${tempPath}
${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }
  cleanup(tempPath) {
    try {
      if (existsSync3(tempPath)) {
        unlinkSync(tempPath);
      }
      this.tempFiles.delete(tempPath);
    } catch {
      this.logger.warn(`Failed to cleanup temp file: ${tempPath}`);
    }
  }
  cleanupAll() {
    for (const tempPath of this.tempFiles) {
      this.cleanup(tempPath);
    }
    this.tempFiles.clear();
    this.removeHandlers();
  }
  removeHandlers() {
    if (this.exitHandler) {
      process.removeListener("exit", this.exitHandler);
    }
    if (this.sigintHandler) {
      process.removeListener("SIGINT", this.sigintHandler);
    }
    if (this.sigtermHandler) {
      process.removeListener("SIGTERM", this.sigtermHandler);
    }
    if (this.uncaughtExceptionHandler) {
      process.removeListener("uncaughtException", this.uncaughtExceptionHandler);
    }
    if (this.unhandledRejectionHandler) {
      process.removeListener("unhandledRejection", this.unhandledRejectionHandler);
    }
    this.cleanupHandlersRegistered = false;
  }
  generateTempPath() {
    const filename = `testdino-config-${randomUUID2()}.json`;
    return join4(tmpdir(), filename);
  }
  registerCleanupHandlers() {
    this.removeHandlers();
    this.exitHandler = () => {
      this.cleanupAll();
    };
    process.on("exit", this.exitHandler);
    this.sigintHandler = () => {
      if (this.sigintHandler) {
        process.removeListener("SIGINT", this.sigintHandler);
      }
    };
    process.on("SIGINT", this.sigintHandler);
    this.sigtermHandler = () => {
      if (this.sigtermHandler) {
        process.removeListener("SIGTERM", this.sigtermHandler);
      }
    };
    process.on("SIGTERM", this.sigtermHandler);
    this.uncaughtExceptionHandler = (error) => {
      this.logger.error("Uncaught exception", error);
      this.cleanupAll();
      process.exit(1);
    };
    process.on("uncaughtException", this.uncaughtExceptionHandler);
    this.unhandledRejectionHandler = (reason) => {
      this.logger.error("Unhandled rejection", reason instanceof Error ? reason : void 0);
      this.cleanupAll();
      process.exit(1);
    };
    process.on("unhandledRejection", this.unhandledRejectionHandler);
  }
  getTempFiles() {
    return Array.from(this.tempFiles);
  }
};

// src/cli/playwright-spawner.ts
import { execa } from "execa";
var PlaywrightSpawner = class {
  logger;
  constructor(logger2) {
    this.logger = logger2 ?? new Logger();
  }
  async spawn(options) {
    const { args, tempConfigPath, config, cwd = process.cwd() } = options;
    try {
      const env = {
        ...process.env,
        TESTDINO_CLI_CONFIG_PATH: tempConfigPath,
        TESTDINO_TOKEN: config.token,
        ...config.serverUrl !== void 0 && { TESTDINO_SERVER_URL: config.serverUrl },
        ...config.ciRunId !== void 0 && { TESTDINO_CI_RUN_ID: config.ciRunId },
        TESTDINO_DEBUG: config.debug ? "true" : "false"
      };
      const playwrightArgs = ["playwright", "test", "--reporter", "@testdino/playwright", ...args];
      const result = await execa("npx", playwrightArgs, {
        stdio: "inherit",
        // Forward stdout/stderr in real-time
        cwd,
        env,
        reject: false
        // Don't throw on non-zero exit codes
      });
      const exitCode = result.exitCode ?? 0;
      return {
        exitCode,
        success: exitCode === 0
      };
    } catch (error) {
      return this.handleSpawnError(error);
    }
  }
  handleSpawnError(error) {
    const execaError = error;
    if (execaError.code === "ENOENT") {
      this.logger.error("Failed to spawn Playwright");
      this.logger.newline();
      this.logger.info("Playwright is not installed or npx is not available.");
      this.logger.newline();
      this.logger.section("To install Playwright:");
      this.logger.code("npm install -D @playwright/test");
      this.logger.code("npx playwright install");
      return {
        exitCode: 1,
        success: false
      };
    }
    if (execaError.code === "EACCES") {
      this.logger.error("Permission denied when trying to spawn Playwright");
      this.logger.newline();
      this.logger.info("Please check file permissions and try again.");
      return {
        exitCode: 1,
        success: false
      };
    }
    this.logger.error("Failed to spawn Playwright");
    this.logger.newline();
    this.logger.info(`Error: ${execaError.message || String(error)}`);
    return {
      exitCode: 1,
      success: false
    };
  }
};

// src/cli/commands/test.ts
var TestCommand = class {
  configLoader;
  configDetector;
  configMerger;
  argFilter;
  tempConfigManager;
  playwrightSpawner;
  constructor(configLoader, configDetector, configMerger, argFilter, tempConfigManager, playwrightSpawner, logger2) {
    this.configLoader = configLoader || new ConfigLoader();
    this.configDetector = configDetector || new ConfigDetector();
    this.configMerger = configMerger || new ConfigMerger();
    this.argFilter = argFilter || new ArgFilter();
    this.tempConfigManager = tempConfigManager || new TempConfigManager(logger2);
    this.playwrightSpawner = playwrightSpawner || new PlaywrightSpawner(logger2);
  }
  async execute(options, args) {
    let tempConfigPath;
    try {
      const testdinoConfigResult = await this.configLoader.load();
      const playwrightConfigResult = await this.configDetector.detect();
      const envConfig = ConfigMerger.getEnvConfig();
      const mergedConfig = this.configMerger.merge({
        env: envConfig,
        playwrightConfig: playwrightConfigResult.options,
        testdinoConfig: testdinoConfigResult.config,
        cliOptions: options
      });
      const tempConfigInfo = this.tempConfigManager.create(mergedConfig);
      tempConfigPath = tempConfigInfo.path;
      const filteredArgs = this.argFilter.filter(args);
      const result = await this.playwrightSpawner.spawn({
        args: filteredArgs,
        tempConfigPath,
        config: mergedConfig
      });
      return result;
    } finally {
      if (tempConfigPath) {
        this.tempConfigManager.cleanup(tempConfigPath);
      }
    }
  }
};

// src/utils/index.ts
function isDebugEnabled() {
  return process.env.TESTDINO_DEBUG === "true" || process.env.TESTDINO_DEBUG === "1";
}

// src/cli/index.ts
var logger = new Logger(isDebugEnabled());
function buildProgram() {
  const program = new Command().name("tdpw").description("Run Playwright tests with TestDino reporting").version(getPackageVersion(), "-v, --version", "Output the current version").helpOption("-h, --help", "Display help for command");
  program.command("test").description("Run Playwright tests with TestDino reporter").option("-t, --token <token>", "TestDino authentication token").option("--ci-run-id <id>", "CI run ID for grouping test runs").option("--server-url <url>", "TestDino server URL").option("--debug", "Enable debug logging").option("--no-artifacts", "Disable artifact uploads (screenshots, videos, traces)").option("--coverage", "Enable code coverage collection").option("--tags <tags>", "Comma-separated run-level tags (e.g. smoke,prod)").allowUnknownOption().allowExcessArguments().action(async (options, command) => {
    if (options.debug) {
      logger.setDebug(true);
    }
    const updatePromise = checkForUpdate(getPackageVersion()).catch(() => void 0);
    const printUpdateNotice = async () => {
      try {
        const latestVersion = await awaitUpdateResult(updatePromise);
        if (latestVersion) {
          logger.updateNotice(getPackageVersion(), latestVersion);
        }
      } catch {
      }
    };
    try {
      const args = command.args || [];
      const testCommand = new TestCommand(void 0, void 0, void 0, void 0, void 0, void 0, logger);
      const result = await testCommand.execute(options, args);
      await printUpdateNotice();
      process.exit(result.exitCode);
    } catch (error) {
      if (error instanceof TestDinoError) {
        logger.error(error.message);
      } else {
        logger.error(
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : void 0
        );
      }
      await printUpdateNotice();
      process.exit(1);
    }
  });
  return program;
}
async function main() {
  try {
    logger.banner(getPackageVersion());
    const program = buildProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof TestDinoError) {
      logger.error(error.message);
    } else {
      logger.error(error instanceof Error ? error.message : String(error), error instanceof Error ? error : void 0);
    }
    process.exit(1);
  }
}
main().catch((error) => {
  logger.error("Unexpected error", error instanceof Error ? error : void 0);
  process.exit(1);
});
//# sourceMappingURL=index.mjs.map