import type { Manifest } from "webextension-polyfill";
import pkg from "../package.json";

const manifest: Manifest.WebExtensionManifest = {
  manifest_version: 3,
  name: pkg.displayName,
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  action: {
    default_popup: "src/pages/popup/index.html",
  },
  icons: {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png",
  },
  permissions: [],
  content_scripts: [
    {
      matches: ["https://classroom.google.com/*"],
      js: ["src/pages/content/index.js"],
      run_at: "document_end",
      css: ["contentStyle.css"],
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        "contentStyle.css",
        "step1cropped.webp",
        "step2cropped.webp",
        "step3cropped.webp",
      ],
      matches: ["https://classroom.google.com/*"],
    },
  ],
};

export default manifest;
