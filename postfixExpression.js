function calcSingleOperation(num1, operator, num2) {
  switch (operator) {
    case "+":
      return +num1 + +num2;
    case "-":
      return +num1 - +num2;
    case "*":
      return +num1 * +num2;
    case "/":
      return Math.floor(+num1 / +num2);
  }
}

function postfixEvaluator(string) {
  const tokens = string.split(" ");
  let index = 0;
  let result = 0;
  const operators = ["-", "+", "*", "/"];
  while (true) {
    const token = tokens[index];
    if (token === undefined) break;
    if (operators.includes(token)) {
      result = calcSingleOperation(tokens[index - 2], token, tokens[index - 1]);
      tokens.splice(index - 2, 3, result);
      index -= 2;
      continue;
    }
    index++;
  }
  return tokens[0];
}
