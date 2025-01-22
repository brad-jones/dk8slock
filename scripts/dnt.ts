import { build, emptyDir } from "@deno/dnt";

const outDir = Deno.args[0];
const version = Deno.args[1];

await emptyDir(outDir);

await build({
  entryPoints: ["./src/mod.ts"],
  outDir,
  importMap: "deno.json",
  scriptModule: false,
  skipSourceOutput: true,
  typeCheck: false,
  skipNpmInstall: true,
  compilerOptions: {
    target: "Latest",
  },
  mappings: {
    "./src/lease/leaser.deno.ts": "./src/lease/leaser.node.ts",
  },
  test: false,
  shims: {
    deno: true,
  },
  package: {
    name: "@brad-jones/dk8slock",
    version,
    description: "A distributed lock for deno (& other Js Runtimes) powered by K8s Leases.",
    license: "MIT",
    author: {
      name: "Brad Jones",
      email: "brad@bjc.id.au",
    },
    repository: {
      type: "git",
      url: "git+https://github.com/brad-jones/dk8slock.git",
    },
    bugs: {
      url: "https://github.com/brad-jones/dk8slock/issues",
    },
  },
});

await Deno.copyFile("LICENSE", `${outDir}/LICENSE`);
await Deno.copyFile("README.md", `${outDir}/README.md`);
await Deno.copyFile("CHANGELOG.md", `${outDir}/CHANGELOG.md`);
