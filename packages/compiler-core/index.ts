import { generate } from "./src/generate"
import { parse } from "./src/parse"
import { transform } from "./src/transform"

function compile(template : string) {
  const ast = parse(template)
  transform(ast)
  return generate(ast)
}

export {
  compile
}