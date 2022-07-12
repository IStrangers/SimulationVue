import { parse } from "./src/parse"

function compile(template : string) {

  const ast = parse(template)
  return ast
  // transform(ast)

  // return generate(ast)
}

export {
  compile
}