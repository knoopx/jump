import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  browser: "firefox",
  manifestVersion: 2,
  webExt: {
    binaries: {
      firefox: "firefox-esr",
    },
  },
  zip: {
    artifactTemplate: "jump-{{version}}.xpi",
  },
  manifest: {
    name: "Jump",
    description: "Keyboard-driven link navigation with per-site selectors",
    browser_specific_settings: {
      gecko: {
        id: "jump@knoopx",
      },
    },
    commands: {
      "activate-click": {
        suggested_key: {
          default: "Ctrl+Shift+J",
        },
        description: "Activate click hints",
      },
      "activate-focus": {
        suggested_key: {
          default: "Ctrl+Shift+K",
        },
        description: "Activate focus hints",
      },
    },
    web_accessible_resources: ["detect-listeners.js"],
  },
});
