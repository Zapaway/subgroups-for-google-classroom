// vite.config.ts
import react from "file:///D:/JavaScript%20Projects/subgroups-for-google-classroom/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { resolve as resolve4 } from "path";
import { defineConfig } from "file:///D:/JavaScript%20Projects/subgroups-for-google-classroom/node_modules/vite/dist/node/index.js";

// utils/plugins/make-manifest.ts
import * as fs from "fs";
import * as path from "path";

// utils/log.ts
function colorLog(message, type) {
  let color = type || COLORS.FgBlack;
  switch (type) {
    case "success":
      color = COLORS.FgGreen;
      break;
    case "info":
      color = COLORS.FgBlue;
      break;
    case "error":
      color = COLORS.FgRed;
      break;
    case "warning":
      color = COLORS.FgYellow;
      break;
  }
  console.log(color, message);
}
var COLORS = {
  Reset: "\x1B[0m",
  Bright: "\x1B[1m",
  Dim: "\x1B[2m",
  Underscore: "\x1B[4m",
  Blink: "\x1B[5m",
  Reverse: "\x1B[7m",
  Hidden: "\x1B[8m",
  FgBlack: "\x1B[30m",
  FgRed: "\x1B[31m",
  FgGreen: "\x1B[32m",
  FgYellow: "\x1B[33m",
  FgBlue: "\x1B[34m",
  FgMagenta: "\x1B[35m",
  FgCyan: "\x1B[36m",
  FgWhite: "\x1B[37m",
  BgBlack: "\x1B[40m",
  BgRed: "\x1B[41m",
  BgGreen: "\x1B[42m",
  BgYellow: "\x1B[43m",
  BgBlue: "\x1B[44m",
  BgMagenta: "\x1B[45m",
  BgCyan: "\x1B[46m",
  BgWhite: "\x1B[47m"
};

// package.json
var package_default = {
  name: "subgroups-for-google-classroom",
  displayName: "Subgroups for Google Classroom",
  version: "1.0.0",
  description: "Allow certain students access to specific Google Classroom posts, assignments, and other material without having to check them off every time!",
  scripts: {
    build: "vite build",
    dev: "nodemon"
  },
  type: "module",
  dependencies: {
    "@types/lodash.trim": "^4.5.7",
    daisyui: "^3.1.5",
    idb: "^7.1.1",
    "lodash.trim": "^4.5.1",
    react: "^18.2.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-dom": "^18.2.0",
    "vite-plugin-css-injected-by-js": "^3.1.1",
    "webextension-polyfill": "^0.10.0",
    zustand: "^4.3.8"
  },
  devDependencies: {
    "@types/chrome": "^0.0.237",
    "@types/node": "^18.11.18",
    "@types/react": "^18.0.27",
    "@types/react-beautiful-dnd": "^13.1.4",
    "@types/react-dom": "^18.0.10",
    "@types/webextension-polyfill": "^0.10.0",
    "@typescript-eslint/eslint-plugin": "^5.49.0",
    "@typescript-eslint/parser": "^5.49.0",
    "@vitejs/plugin-react-swc": "^3.0.1",
    autoprefixer: "^10.4.13",
    eslint: "^8.32.0",
    "eslint-config-prettier": "^8.6.0",
    "eslint-plugin-import": "^2.27.5",
    "eslint-plugin-jsx-a11y": "^6.7.1",
    "eslint-plugin-react": "^7.32.1",
    "eslint-plugin-react-hooks": "^4.3.0",
    "fs-extra": "^11.1.0",
    nodemon: "^2.0.20",
    postcss: "^8.4.21",
    tailwindcss: "^3.2.4",
    "ts-node": "^10.9.1",
    typescript: "^4.9.4",
    vite: "^4.0.4"
  }
};

// src/manifest.ts
var manifest = {
  manifest_version: 3,
  name: package_default.displayName,
  version: package_default.version,
  description: package_default.description,
  background: {
    service_worker: "src/pages/background/index.js",
    type: "module"
  },
  action: {
    // default_popup: "src/pages/popup/index.html",
    default_icon: {
      "16": "icon-16.png",
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  },
  icons: {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  },
  permissions: ["activeTab", "scripting"],
  content_scripts: [
    {
      matches: ["https://classroom.google.com/*"],
      js: ["src/pages/content/index.js"],
      run_at: "document_end",
      css: ["contentStyle.css"]
    }
  ],
  web_accessible_resources: [
    {
      resources: ["contentStyle.css", "icon-128.png", "icon-34.png"],
      matches: []
    }
  ]
};
var manifest_default = manifest;

// utils/plugins/make-manifest.ts
var __vite_injected_original_dirname = "D:\\JavaScript Projects\\subgroups-for-google-classroom\\utils\\plugins";
var { resolve } = path;
var outDir = resolve(__vite_injected_original_dirname, "..", "..", "public");
function makeManifest() {
  return {
    name: "make-manifest",
    buildEnd() {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
      }
      const manifestPath = resolve(outDir, "manifest.json");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest_default, null, 2));
      colorLog(`Manifest file copy complete: ${manifestPath}`, "success");
    }
  };
}

// utils/plugins/build-content-script.ts
import { build } from "file:///D:/JavaScript%20Projects/subgroups-for-google-classroom/node_modules/vite/dist/node/index.js";
import { resolve as resolve2 } from "path";

// utils/constants.ts
var outputFolderName = "dist";

// utils/plugins/build-content-script.ts
import cssInjectedByJsPlugin from "file:///D:/JavaScript%20Projects/subgroups-for-google-classroom/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
var __vite_injected_original_dirname2 = "D:\\JavaScript Projects\\subgroups-for-google-classroom\\utils\\plugins";
var packages = [
  {
    content: resolve2(__vite_injected_original_dirname2, "../../", "src/pages/content/index.tsx")
  }
];
var outDir2 = resolve2(__vite_injected_original_dirname2, "../../", outputFolderName);
function buildContentScript() {
  return {
    name: "build-content",
    async buildEnd() {
      for (const _package of packages) {
        await build({
          publicDir: false,
          plugins: [cssInjectedByJsPlugin()],
          build: {
            outDir: outDir2,
            sourcemap: process.env.__DEV__ === "true",
            emptyOutDir: false,
            rollupOptions: {
              input: _package,
              output: {
                entryFileNames: (chunk) => {
                  return `src/pages/${chunk.name}/index.js`;
                }
              }
            }
          },
          configFile: false
        });
      }
      colorLog("Content code build sucessfully", "success");
    }
  };
}

// utils/plugins/build-external-script.ts
import { build as build2 } from "file:///D:/JavaScript%20Projects/subgroups-for-google-classroom/node_modules/vite/dist/node/index.js";
import { resolve as resolve3 } from "path";
var __vite_injected_original_dirname3 = "D:\\JavaScript Projects\\subgroups-for-google-classroom\\utils\\plugins";
var externalScript = [
  {
    script: resolve3(__vite_injected_original_dirname3, "../../", "src/pages/background/script.ts")
  }
];
var outDir3 = resolve3(__vite_injected_original_dirname3, "../../", outputFolderName);
function buildExternalScript() {
  return {
    name: "build-external",
    async buildEnd() {
      for (const script of externalScript) {
        await build2({
          publicDir: false,
          build: {
            outDir: outDir3,
            sourcemap: process.env.__DEV__ === "true",
            emptyOutDir: false,
            rollupOptions: {
              input: script,
              output: {
                entryFileNames: (chunk) => {
                  return `src/pages/background/${chunk.name}.js`;
                }
              }
            }
          },
          configFile: false
        });
      }
      colorLog("External script file build sucessfully", "success");
    }
  };
}

// vite.config.ts
var __vite_injected_original_dirname4 = "D:\\JavaScript Projects\\subgroups-for-google-classroom";
var root = resolve4(__vite_injected_original_dirname4, "src");
var pagesDir = resolve4(root, "pages");
var assetsDir = resolve4(root, "assets");
var outDir4 = resolve4(__vite_injected_original_dirname4, outputFolderName);
var publicDir = resolve4(__vite_injected_original_dirname4, "public");
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@src": root,
      "@assets": assetsDir,
      "@pages": pagesDir
    }
  },
  plugins: [react(), makeManifest(), buildContentScript(), buildExternalScript()],
  publicDir,
  build: {
    outDir: outDir4,
    sourcemap: process.env.__DEV__ === "true",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve4(pagesDir, "background", "index.ts"),
        popup: resolve4(pagesDir, "popup", "index.html")
      },
      output: {
        entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAidXRpbHMvcGx1Z2lucy9tYWtlLW1hbmlmZXN0LnRzIiwgInV0aWxzL2xvZy50cyIsICJwYWNrYWdlLmpzb24iLCAic3JjL21hbmlmZXN0LnRzIiwgInV0aWxzL3BsdWdpbnMvYnVpbGQtY29udGVudC1zY3JpcHQudHMiLCAidXRpbHMvY29uc3RhbnRzLnRzIiwgInV0aWxzL3BsdWdpbnMvYnVpbGQtZXh0ZXJuYWwtc2NyaXB0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcSmF2YVNjcmlwdCBQcm9qZWN0c1xcXFxzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9KYXZhU2NyaXB0JTIwUHJvamVjdHMvc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3Yyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBtYWtlTWFuaWZlc3QgZnJvbSAnLi91dGlscy9wbHVnaW5zL21ha2UtbWFuaWZlc3QnO1xuaW1wb3J0IGJ1aWxkQ29udGVudFNjcmlwdCBmcm9tICcuL3V0aWxzL3BsdWdpbnMvYnVpbGQtY29udGVudC1zY3JpcHQnO1xuaW1wb3J0IGJ1aWxkRXh0ZXJuYWxTY3JpcHQgZnJvbSAnLi91dGlscy9wbHVnaW5zL2J1aWxkLWV4dGVybmFsLXNjcmlwdCc7XG5pbXBvcnQgeyBvdXRwdXRGb2xkZXJOYW1lIH0gZnJvbSAnLi91dGlscy9jb25zdGFudHMnO1xuIFxuY29uc3Qgcm9vdCA9IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyk7XG5jb25zdCBwYWdlc0RpciA9IHJlc29sdmUocm9vdCwgJ3BhZ2VzJyk7XG5jb25zdCBhc3NldHNEaXIgPSByZXNvbHZlKHJvb3QsICdhc3NldHMnKTtcbmNvbnN0IG91dERpciA9IHJlc29sdmUoX19kaXJuYW1lLCBvdXRwdXRGb2xkZXJOYW1lKTtcbmNvbnN0IHB1YmxpY0RpciA9IHJlc29sdmUoX19kaXJuYW1lLCAncHVibGljJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0BzcmMnOiByb290LFxuICAgICAgJ0Bhc3NldHMnOiBhc3NldHNEaXIsXG4gICAgICAnQHBhZ2VzJzogcGFnZXNEaXIsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW3JlYWN0KCksIG1ha2VNYW5pZmVzdCgpLCBidWlsZENvbnRlbnRTY3JpcHQoKSwgYnVpbGRFeHRlcm5hbFNjcmlwdCgpXSxcbiAgcHVibGljRGlyLFxuICBidWlsZDoge1xuICAgIG91dERpcixcbiAgICBzb3VyY2VtYXA6IHByb2Nlc3MuZW52Ll9fREVWX18gPT09ICd0cnVlJyxcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgYmFja2dyb3VuZDogcmVzb2x2ZShwYWdlc0RpciwgJ2JhY2tncm91bmQnLCAnaW5kZXgudHMnKSxcbiAgICAgICAgcG9wdXA6IHJlc29sdmUocGFnZXNEaXIsICdwb3B1cCcsICdpbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAoY2h1bmspID0+IGBzcmMvcGFnZXMvJHtjaHVuay5uYW1lfS9pbmRleC5qc2AsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcSmF2YVNjcmlwdCBQcm9qZWN0c1xcXFxzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cXFxcdXRpbHNcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcSmF2YVNjcmlwdCBQcm9qZWN0c1xcXFxzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cXFxcdXRpbHNcXFxccGx1Z2luc1xcXFxtYWtlLW1hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9KYXZhU2NyaXB0JTIwUHJvamVjdHMvc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tL3V0aWxzL3BsdWdpbnMvbWFrZS1tYW5pZmVzdC50c1wiO2ltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY29sb3JMb2cgZnJvbSAnLi4vbG9nJztcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuLi8uLi9zcmMvbWFuaWZlc3QnO1xuaW1wb3J0IHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSc7XG5cbmNvbnN0IHsgcmVzb2x2ZSB9ID0gcGF0aDtcblxuY29uc3Qgb3V0RGlyID0gcmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwdWJsaWMnKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWFrZU1hbmlmZXN0KCk6IFBsdWdpbk9wdGlvbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ21ha2UtbWFuaWZlc3QnLFxuICAgIGJ1aWxkRW5kKCkge1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG91dERpcikpIHtcbiAgICAgICAgZnMubWtkaXJTeW5jKG91dERpcik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hbmlmZXN0UGF0aCA9IHJlc29sdmUob3V0RGlyLCAnbWFuaWZlc3QuanNvbicpO1xuXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKG1hbmlmZXN0UGF0aCwgSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QsIG51bGwsIDIpKTtcblxuICAgICAgY29sb3JMb2coYE1hbmlmZXN0IGZpbGUgY29weSBjb21wbGV0ZTogJHttYW5pZmVzdFBhdGh9YCwgJ3N1Y2Nlc3MnKTtcbiAgICB9LFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxKYXZhU2NyaXB0IFByb2plY3RzXFxcXHN1Ymdyb3Vwcy1mb3ItZ29vZ2xlLWNsYXNzcm9vbVxcXFx1dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcSmF2YVNjcmlwdCBQcm9qZWN0c1xcXFxzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cXFxcdXRpbHNcXFxcbG9nLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9KYXZhU2NyaXB0JTIwUHJvamVjdHMvc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tL3V0aWxzL2xvZy50c1wiO3R5cGUgQ29sb3JUeXBlID0gJ3N1Y2Nlc3MnIHwgJ2luZm8nIHwgJ2Vycm9yJyB8ICd3YXJuaW5nJyB8IGtleW9mIHR5cGVvZiBDT0xPUlM7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbG9yTG9nKG1lc3NhZ2U6IHN0cmluZywgdHlwZT86IENvbG9yVHlwZSkge1xuICBsZXQgY29sb3I6IHN0cmluZyA9IHR5cGUgfHwgQ09MT1JTLkZnQmxhY2s7XG5cbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnc3VjY2Vzcyc6XG4gICAgICBjb2xvciA9IENPTE9SUy5GZ0dyZWVuO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaW5mbyc6XG4gICAgICBjb2xvciA9IENPTE9SUy5GZ0JsdWU7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBjb2xvciA9IENPTE9SUy5GZ1JlZDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgY29sb3IgPSBDT0xPUlMuRmdZZWxsb3c7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGNvbG9yLCBtZXNzYWdlKTtcbn1cblxuY29uc3QgQ09MT1JTID0ge1xuICBSZXNldDogJ1xceDFiWzBtJyxcbiAgQnJpZ2h0OiAnXFx4MWJbMW0nLFxuICBEaW06ICdcXHgxYlsybScsXG4gIFVuZGVyc2NvcmU6ICdcXHgxYls0bScsXG4gIEJsaW5rOiAnXFx4MWJbNW0nLFxuICBSZXZlcnNlOiAnXFx4MWJbN20nLFxuICBIaWRkZW46ICdcXHgxYls4bScsXG4gIEZnQmxhY2s6ICdcXHgxYlszMG0nLFxuICBGZ1JlZDogJ1xceDFiWzMxbScsXG4gIEZnR3JlZW46ICdcXHgxYlszMm0nLFxuICBGZ1llbGxvdzogJ1xceDFiWzMzbScsXG4gIEZnQmx1ZTogJ1xceDFiWzM0bScsXG4gIEZnTWFnZW50YTogJ1xceDFiWzM1bScsXG4gIEZnQ3lhbjogJ1xceDFiWzM2bScsXG4gIEZnV2hpdGU6ICdcXHgxYlszN20nLFxuICBCZ0JsYWNrOiAnXFx4MWJbNDBtJyxcbiAgQmdSZWQ6ICdcXHgxYls0MW0nLFxuICBCZ0dyZWVuOiAnXFx4MWJbNDJtJyxcbiAgQmdZZWxsb3c6ICdcXHgxYls0M20nLFxuICBCZ0JsdWU6ICdcXHgxYls0NG0nLFxuICBCZ01hZ2VudGE6ICdcXHgxYls0NW0nLFxuICBCZ0N5YW46ICdcXHgxYls0Nm0nLFxuICBCZ1doaXRlOiAnXFx4MWJbNDdtJyxcbn0gYXMgY29uc3Q7XG4iLCAie1xuICBcIm5hbWVcIjogXCJzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cIixcbiAgXCJkaXNwbGF5TmFtZVwiOiBcIlN1Ymdyb3VwcyBmb3IgR29vZ2xlIENsYXNzcm9vbVwiLFxuICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiQWxsb3cgY2VydGFpbiBzdHVkZW50cyBhY2Nlc3MgdG8gc3BlY2lmaWMgR29vZ2xlIENsYXNzcm9vbSBwb3N0cywgYXNzaWdubWVudHMsIGFuZCBvdGhlciBtYXRlcmlhbCB3aXRob3V0IGhhdmluZyB0byBjaGVjayB0aGVtIG9mZiBldmVyeSB0aW1lIVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYnVpbGRcIjogXCJ2aXRlIGJ1aWxkXCIsXG4gICAgXCJkZXZcIjogXCJub2RlbW9uXCJcbiAgfSxcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB0eXBlcy9sb2Rhc2gudHJpbVwiOiBcIl40LjUuN1wiLFxuICAgIFwiZGFpc3l1aVwiOiBcIl4zLjEuNVwiLFxuICAgIFwiaWRiXCI6IFwiXjcuMS4xXCIsXG4gICAgXCJsb2Rhc2gudHJpbVwiOiBcIl40LjUuMVwiLFxuICAgIFwicmVhY3RcIjogXCJeMTguMi4wXCIsXG4gICAgXCJyZWFjdC1iZWF1dGlmdWwtZG5kXCI6IFwiXjEzLjEuMVwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjIuMFwiLFxuICAgIFwidml0ZS1wbHVnaW4tY3NzLWluamVjdGVkLWJ5LWpzXCI6IFwiXjMuMS4xXCIsXG4gICAgXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIjogXCJeMC4xMC4wXCIsXG4gICAgXCJ6dXN0YW5kXCI6IFwiXjQuMy44XCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHR5cGVzL2Nocm9tZVwiOiBcIl4wLjAuMjM3XCIsXG4gICAgXCJAdHlwZXMvbm9kZVwiOiBcIl4xOC4xMS4xOFwiLFxuICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjAuMjdcIixcbiAgICBcIkB0eXBlcy9yZWFjdC1iZWF1dGlmdWwtZG5kXCI6IFwiXjEzLjEuNFwiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4wLjEwXCIsXG4gICAgXCJAdHlwZXMvd2ViZXh0ZW5zaW9uLXBvbHlmaWxsXCI6IFwiXjAuMTAuMFwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeNS40OS4wXCIsXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvcGFyc2VyXCI6IFwiXjUuNDkuMFwiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI6IFwiXjMuMC4xXCIsXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4xM1wiLFxuICAgIFwiZXNsaW50XCI6IFwiXjguMzIuMFwiLFxuICAgIFwiZXNsaW50LWNvbmZpZy1wcmV0dGllclwiOiBcIl44LjYuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1pbXBvcnRcIjogXCJeMi4yNy41XCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLWpzeC1hMTF5XCI6IFwiXjYuNy4xXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0XCI6IFwiXjcuMzIuMVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdC1ob29rc1wiOiBcIl40LjMuMFwiLFxuICAgIFwiZnMtZXh0cmFcIjogXCJeMTEuMS4wXCIsXG4gICAgXCJub2RlbW9uXCI6IFwiXjIuMC4yMFwiLFxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMjFcIixcbiAgICBcInRhaWx3aW5kY3NzXCI6IFwiXjMuMi40XCIsXG4gICAgXCJ0cy1ub2RlXCI6IFwiXjEwLjkuMVwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl40LjkuNFwiLFxuICAgIFwidml0ZVwiOiBcIl40LjAuNFwiXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcSmF2YVNjcmlwdCBQcm9qZWN0c1xcXFxzdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb21cXFxcc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxKYXZhU2NyaXB0IFByb2plY3RzXFxcXHN1Ymdyb3Vwcy1mb3ItZ29vZ2xlLWNsYXNzcm9vbVxcXFxzcmNcXFxcbWFuaWZlc3QudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0phdmFTY3JpcHQlMjBQcm9qZWN0cy9zdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb20vc3JjL21hbmlmZXN0LnRzXCI7aW1wb3J0IHR5cGUgeyBNYW5pZmVzdCB9IGZyb20gXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIjtcbmltcG9ydCBwa2cgZnJvbSBcIi4uL3BhY2thZ2UuanNvblwiO1xuXG5jb25zdCBtYW5pZmVzdDogTWFuaWZlc3QuV2ViRXh0ZW5zaW9uTWFuaWZlc3QgPSB7XG4gIG1hbmlmZXN0X3ZlcnNpb246IDMsXG4gIG5hbWU6IHBrZy5kaXNwbGF5TmFtZSxcbiAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gIGRlc2NyaXB0aW9uOiBwa2cuZGVzY3JpcHRpb24sXG4gIGJhY2tncm91bmQ6IHtcbiAgICBzZXJ2aWNlX3dvcmtlcjogXCJzcmMvcGFnZXMvYmFja2dyb3VuZC9pbmRleC5qc1wiLFxuICAgIHR5cGU6IFwibW9kdWxlXCIsXG4gIH0sXG4gIGFjdGlvbjoge1xuICAgIC8vIGRlZmF1bHRfcG9wdXA6IFwic3JjL3BhZ2VzL3BvcHVwL2luZGV4Lmh0bWxcIixcbiAgICBkZWZhdWx0X2ljb246IHtcbiAgICAgIFwiMTZcIjogXCJpY29uLTE2LnBuZ1wiLFxuICAgICAgXCIzMlwiOiBcImljb24tMzIucG5nXCIsXG4gICAgICBcIjQ4XCI6IFwiaWNvbi00OC5wbmdcIixcbiAgICAgIFwiMTI4XCI6IFwiaWNvbi0xMjgucG5nXCIsXG4gICAgfSxcbiAgfSxcbiAgaWNvbnM6IHtcbiAgICBcIjE2XCI6IFwiaWNvbi0xNi5wbmdcIixcbiAgICBcIjMyXCI6IFwiaWNvbi0zMi5wbmdcIixcbiAgICBcIjQ4XCI6IFwiaWNvbi00OC5wbmdcIixcbiAgICBcIjEyOFwiOiBcImljb24tMTI4LnBuZ1wiLFxuICB9LFxuICBwZXJtaXNzaW9uczogW1wiYWN0aXZlVGFiXCIsIFwic2NyaXB0aW5nXCJdLFxuICBjb250ZW50X3NjcmlwdHM6IFtcbiAgICB7XG4gICAgICBtYXRjaGVzOiBbXCJodHRwczovL2NsYXNzcm9vbS5nb29nbGUuY29tLypcIl0sXG4gICAgICBqczogW1wic3JjL3BhZ2VzL2NvbnRlbnQvaW5kZXguanNcIl0sXG4gICAgICBydW5fYXQ6IFwiZG9jdW1lbnRfZW5kXCIsXG4gICAgICBjc3M6IFtcImNvbnRlbnRTdHlsZS5jc3NcIl0sXG4gICAgfSxcbiAgXSxcbiAgd2ViX2FjY2Vzc2libGVfcmVzb3VyY2VzOiBbXG4gICAge1xuICAgICAgcmVzb3VyY2VzOiBbXCJjb250ZW50U3R5bGUuY3NzXCIsIFwiaWNvbi0xMjgucG5nXCIsIFwiaWNvbi0zNC5wbmdcIl0sXG4gICAgICBtYXRjaGVzOiBbXSxcbiAgICB9LFxuICBdLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgbWFuaWZlc3Q7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHV0aWxzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHV0aWxzXFxcXHBsdWdpbnNcXFxcYnVpbGQtY29udGVudC1zY3JpcHQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0phdmFTY3JpcHQlMjBQcm9qZWN0cy9zdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb20vdXRpbHMvcGx1Z2lucy9idWlsZC1jb250ZW50LXNjcmlwdC50c1wiO2ltcG9ydCBjb2xvckxvZyBmcm9tICcuLi9sb2cnO1xuaW1wb3J0IHsgUGx1Z2luT3B0aW9uLCBidWlsZCB9IGZyb20gJ3ZpdGUnOyBcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IG91dHB1dEZvbGRlck5hbWUgfSBmcm9tICcuLi9jb25zdGFudHMnO1xuaW1wb3J0IGNzc0luamVjdGVkQnlKc1BsdWdpbiBmcm9tICd2aXRlLXBsdWdpbi1jc3MtaW5qZWN0ZWQtYnktanMnXG5cbmNvbnN0IHBhY2thZ2VzID0gW1xuICB7XG4gICAgY29udGVudDogIHJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vJywgJ3NyYy9wYWdlcy9jb250ZW50L2luZGV4LnRzeCcpXG4gIH0sXG5dO1xuXG5jb25zdCBvdXREaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uLycsICBvdXRwdXRGb2xkZXJOYW1lKTsgXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJ1aWxkQ29udGVudFNjcmlwdCgpOiBQbHVnaW5PcHRpb24ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdidWlsZC1jb250ZW50JyxcbiAgICBhc3luYyBidWlsZEVuZCgpIHtcbiAgICAgIGZvciAoY29uc3QgX3BhY2thZ2Ugb2YgcGFja2FnZXMpIHtcbiAgICAgICAgYXdhaXQgYnVpbGQoe1xuICAgICAgICAgIHB1YmxpY0RpcjogZmFsc2UsXG4gICAgICAgICAgcGx1Z2luczogWyBjc3NJbmplY3RlZEJ5SnNQbHVnaW4oKSBdLFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBvdXREaXIsXG4gICAgICAgICAgICBzb3VyY2VtYXA6IHByb2Nlc3MuZW52Ll9fREVWX18gPT09ICd0cnVlJyxcbiAgICAgICAgICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgaW5wdXQ6IF9wYWNrYWdlLFxuICAgICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBlbnRyeUZpbGVOYW1lczogKGNodW5rKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYHNyYy9wYWdlcy8ke2NodW5rLm5hbWV9L2luZGV4LmpzYDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmZpZ0ZpbGU6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbG9yTG9nKCdDb250ZW50IGNvZGUgYnVpbGQgc3VjZXNzZnVsbHknLCAnc3VjY2VzcycpO1xuICAgIH0sXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHV0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxKYXZhU2NyaXB0IFByb2plY3RzXFxcXHN1Ymdyb3Vwcy1mb3ItZ29vZ2xlLWNsYXNzcm9vbVxcXFx1dGlsc1xcXFxjb25zdGFudHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0phdmFTY3JpcHQlMjBQcm9qZWN0cy9zdWJncm91cHMtZm9yLWdvb2dsZS1jbGFzc3Jvb20vdXRpbHMvY29uc3RhbnRzLnRzXCI7ZXhwb3J0IGNvbnN0IG91dHB1dEZvbGRlck5hbWUgPSAnZGlzdCc7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHV0aWxzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXEphdmFTY3JpcHQgUHJvamVjdHNcXFxcc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tXFxcXHV0aWxzXFxcXHBsdWdpbnNcXFxcYnVpbGQtZXh0ZXJuYWwtc2NyaXB0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9KYXZhU2NyaXB0JTIwUHJvamVjdHMvc3ViZ3JvdXBzLWZvci1nb29nbGUtY2xhc3Nyb29tL3V0aWxzL3BsdWdpbnMvYnVpbGQtZXh0ZXJuYWwtc2NyaXB0LnRzXCI7aW1wb3J0IGNvbG9yTG9nIGZyb20gXCIuLi9sb2dcIjtcclxuaW1wb3J0IHsgUGx1Z2luT3B0aW9uLCBidWlsZCB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBvdXRwdXRGb2xkZXJOYW1lIH0gZnJvbSBcIi4uL2NvbnN0YW50c1wiO1xyXG5cclxuY29uc3QgZXh0ZXJuYWxTY3JpcHQgPSBbXHJcbiAge1xyXG4gICAgc2NyaXB0OiByZXNvbHZlKF9fZGlybmFtZSwgXCIuLi8uLi9cIiwgXCJzcmMvcGFnZXMvYmFja2dyb3VuZC9zY3JpcHQudHNcIiksXHJcbiAgfSxcclxuXTtcclxuXHJcbmNvbnN0IG91dERpciA9IHJlc29sdmUoX19kaXJuYW1lLCBcIi4uLy4uL1wiLCBvdXRwdXRGb2xkZXJOYW1lKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJ1aWxkRXh0ZXJuYWxTY3JpcHQoKTogUGx1Z2luT3B0aW9uIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogXCJidWlsZC1leHRlcm5hbFwiLFxyXG4gICAgYXN5bmMgYnVpbGRFbmQoKSB7XHJcbiAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIGV4dGVybmFsU2NyaXB0KSB7XHJcbiAgICAgICAgYXdhaXQgYnVpbGQoe1xyXG4gICAgICAgICAgcHVibGljRGlyOiBmYWxzZSxcclxuICAgICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICAgIG91dERpcixcclxuICAgICAgICAgICAgc291cmNlbWFwOiBwcm9jZXNzLmVudi5fX0RFVl9fID09PSBcInRydWVcIixcclxuICAgICAgICAgICAgZW1wdHlPdXREaXI6IGZhbHNlLFxyXG4gICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgaW5wdXQ6IHNjcmlwdCxcclxuICAgICAgICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAoY2h1bmspID0+IHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGBzcmMvcGFnZXMvYmFja2dyb3VuZC8ke2NodW5rLm5hbWV9LmpzYDtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBjb25maWdGaWxlOiBmYWxzZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBjb2xvckxvZyhcIkV4dGVybmFsIHNjcmlwdCBmaWxlIGJ1aWxkIHN1Y2Vzc2Z1bGx5XCIsIFwic3VjY2Vzc1wiKTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlWLE9BQU8sV0FBVztBQUMzVyxTQUFTLFdBQUFBLGdCQUFlO0FBQ3hCLFNBQVMsb0JBQW9COzs7QUNGOFcsWUFBWSxRQUFRO0FBQy9aLFlBQVksVUFBVTs7O0FDQ1AsU0FBUixTQUEwQixTQUFpQixNQUFrQjtBQUNsRSxNQUFJLFFBQWdCLFFBQVEsT0FBTztBQUVuQyxVQUFRLE1BQU07QUFBQSxJQUNaLEtBQUs7QUFDSCxj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LElBQU0sT0FBT0MsU0FBUUMsbUNBQVcsS0FBSztBQUNyQyxJQUFNLFdBQVdELFNBQVEsTUFBTSxPQUFPO0FBQ3RDLElBQU0sWUFBWUEsU0FBUSxNQUFNLFFBQVE7QUFDeEMsSUFBTUUsVUFBU0YsU0FBUUMsbUNBQVcsZ0JBQWdCO0FBQ2xELElBQU0sWUFBWUQsU0FBUUMsbUNBQVcsUUFBUTtBQUU3QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsYUFBYSxHQUFHLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDO0FBQUEsRUFDOUU7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQUFDO0FBQUEsSUFDQSxXQUFXLFFBQVEsSUFBSSxZQUFZO0FBQUEsSUFDbkMsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsWUFBWUYsU0FBUSxVQUFVLGNBQWMsVUFBVTtBQUFBLFFBQ3RELE9BQU9BLFNBQVEsVUFBVSxTQUFTLFlBQVk7QUFBQSxNQUNoRDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCLENBQUMsVUFBVSxhQUFhLE1BQU07QUFBQSxNQUNoRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicmVzb2x2ZSIsICJyZXNvbHZlIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInJlc29sdmUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAib3V0RGlyIiwgImJ1aWxkIiwgInJlc29sdmUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicmVzb2x2ZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJvdXREaXIiLCAiYnVpbGQiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicmVzb2x2ZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJvdXREaXIiXQp9Cg==
