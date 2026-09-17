import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  return {
    root: isBuild ? undefined : resolve(__dirname, "demo"),
    plugins: isBuild
      ? [
          dts({
            include: ["src"],
            rollupTypes: true,
            tsconfigPath: resolve(__dirname, "tsconfig.build.json"),
          }),
        ]
      : [],
    build: {
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "MorePass",
        formats: ["es", "cjs"],
        fileName: (format) =>
          format === "es" ? "morepass.js" : "morepass.cjs",
      },
      rollupOptions: {
        output: {
          exports: "named",
        },
      },
      minify: true,
      outDir: resolve(__dirname, "dist"),
    },
    test: {
      environment: "jsdom",
      globals: true,
      root: resolve(__dirname),
    },
  };
});
