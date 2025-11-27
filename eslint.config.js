import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

const reactRecommended = pluginReact.configs.flat.recommended;

export default defineConfig([
  {
    ignores: [
      "vendor/**",
      "node_modules/**",
      "public/**",
      "storage/**",
      "bootstrap/**",
      "database/**",
    ],
  },
  js.configs.recommended,
  {
    ...reactRecommended,
    files: ["resources/js/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
        route: "readonly",
        ...reactRecommended.languageOptions?.globals,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      ...reactRecommended.settings,
    },
    rules: {
      ...reactRecommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "no-unused-vars": "warn",
    },
  },
]);
