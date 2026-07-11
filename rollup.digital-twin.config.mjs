import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/domains/crowd/DigitalTwin.tsx",
  output: [
    {
      file: "dist/digital-twin/index.js",
      format: "esm",
      sourcemap: true
    }
  ],
  external: ["solid-js", "solid-js/web"],
  plugins: [nodeResolve({ extensions: [".ts", ".tsx", ".js"] })]
};
