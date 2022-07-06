const { build } = require("esbuild");
const {resolve} = require("path");
const { exit } = require("process");
const args = require("minimist")(process.argv.slice(2))

const target = args._[0]

if(!target) {
  return;
}

const pkg = require(resolve(__dirname,`../packages/${target}/package.json`))

const formats = pkg.buildOptions.formats
for(let i = 0; i < formats.length; i++) {
  const format = formats[i]
  const outfile = resolve(__dirname,`../dist/${target}/${target}.${format}.js`)

  build({
    entryPoints: [resolve(__dirname,`../packages/${target}/index.ts`)],
    outfile,
    bundle: true,
    sourcemap: true,
    format,
    globalName: pkg.buildOptions.name,
    platform: format === "cjs" ? "node" : "browser",
    watch: {
      onRebuild(error) {
        error && console.log(error)
      }
    }
  }).then(() => {
    console.log("watching...")
    if((i + 1) === formats.length) {
      exit()
    }
  })
  
}
