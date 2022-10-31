function Interpreter() {
	this.variables = {};
	this.functions = {};
	this.stack = [];
	this.operators = ["-", "+", "*", "/", "=", "%"];
}
Interpreter.prototype.calcSingleOperation = function (num1, operator, num2) {
	let _num1 = num1.trim();
	let _num2 = num2.trim();
	if (operator !== "=") {
		_num1 = +num1 || this.variables[_num1];
		_num2 = +num2 || this.variables[_num2];
	}
	switch (operator) {
		case "+":
			return +_num1 + +_num2;
		case "-":
			return +_num1 - +_num2;
		case "*":
			return +_num1 * +_num2;
		case "/":
			return +_num1 / +_num2;
		case "%":
			return +_num1 % +_num2;
		case "=":
			return this.assignVariable(_num1, _num2);
		default:
			return 0;
	}
};
Interpreter.prototype.getEndOfParentheses = function (expression) {
	let parentheses = 0;
	return (
		[...expression].reduce((acc, ele, i) => {
			if (ele === "(") parentheses++;
			if (ele === ")") parentheses--;
			if (parentheses < 0) return acc > 0 ? acc : i;
			return acc;
		}, 0) + 1
	);
};
Interpreter.prototype.getLeftAndRight = function (expression, index) {
	let leftStartIndex = index - 1;
	let rightStartIndex = index + 1;
	const result = { left: "", right: "" };
	while (true) {
		const char = expression[leftStartIndex];
		if (
			char === undefined ||
			(this.operators.includes(char) && char !== "-") ||
			(char === "-" && expression[leftStartIndex + 1] && expression[leftStartIndex + 1].match(/\s/)) ||
			(char === "-" && !(expression[leftStartIndex - 1] && expression[leftStartIndex - 1].match(/\s/)))
		)
			break;
		if (char.match(/[\d\.-]/)) {
			result.left = char + (result.left || "");
		}
		leftStartIndex--;
	}
	while (true) {
		const char = expression[rightStartIndex];
		if (char === undefined || (result.right && this.operators.includes(char))) break;
		if (char.match(/[\d\.-]/)) {
			result.right = (result.right || "") + char;
		}
		rightStartIndex++;
	}
	return result;
};
Interpreter.prototype.calculatePrecedentOPeration = function (match, expression) {
	const { left, right } = this.getLeftAndRight(expression, match.index);
	const regExp = new RegExp(`(\\s*${left}\\s*\\${match[0]}\\s*${right}\\s*)`);
	const result = this.calcSingleOperation(left, match[0], right);
	expression = expression.replace(regExp, `${result}`);
	return this.calc(expression);
};
Interpreter.prototype.calc = function (expression) {
	expression = expression.trim();
	let index = 0;
	let singleOperation = [];
	const hasMulOrDiv = expression.match(/[\*/]/);
	const hasModule = expression.match(/[%]/);
	const hasParentheses = expression.match(/\(/);
	expression = expression.replace(/(--)/g, "");
	expression = expression.replace(/(-\+)/g, "-");
	expression = expression.replace(/(\+-)/g, "-");
	expression = expression.replace(/(\+\+)/g, "+");
	if (hasParentheses) {
		index = hasParentheses.index;
		const closingIndex = this.getEndOfParentheses(expression.slice(index + 1));
		const result = this.calc(expression.slice(index + 1, closingIndex + index));
		expression = expression.slice(0, index) + result + expression.slice(closingIndex + index + 1);
		return this.calc(expression);
	}
	if (hasModule) return this.calculatePrecedentOPeration(hasModule, expression);
	if (hasMulOrDiv) return this.calculatePrecedentOPeration(hasMulOrDiv, expression);

	while (true) {
		const char = expression[index];
		if (char === undefined) return +expression.replace(/[\(\)]/g, "");
		if (!this.operators.includes(char)) {
			if (singleOperation.length === 0 || singleOperation.length === 2) singleOperation.push(char);
			else {
				const lastIndex = singleOperation.length - 1;
				singleOperation[lastIndex] = singleOperation[lastIndex] + char;
			}
		}
		if (this.operators.includes(char)) singleOperation.push(char);
		if (
			singleOperation.length === 3 &&
			!(expression[index + 1] && expression[index + 1].match(/[\d\.]/))
		) {
			const [num1, operator, num2] = singleOperation;
			const result = this.calcSingleOperation(num1, operator, num2);
			if (expression[index + 1] === undefined) return result;
			singleOperation = [`${result}`];
		}
		index++;
	}
};

Interpreter.prototype.tokenize = function (program) {
	if (program === "") return [];
	const regex = /\s*(=>|[-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
	return program.split(regex).filter(s => !s.match(/^\s*$/));
};

Interpreter.prototype.assignVariable = function (identifier, value) {
	const existingVariableValue = this.variables[value];
	if (!isNaN(+value)) {
		this.variables[identifier] = +value;
		return +value;
	} else if (existingVariableValue) {
		this.variables[identifier] = existingVariableValue;
		return existingVariableValue;
	} else throw new Error(`${value} is not defined`);
};

Interpreter.prototype.input = function (expression) {
	const tokens = this.tokenize(expression);
	if (!tokens.length) return "";
	else if (tokens.length === 1) {
		const identifier = tokens[0];
		if (this.variables[identifier]) return this.variables[tokens[0]];
		else if (+identifier) return +identifier;
		else if (!this.functions[identifier]) throw new Error(`${identifier} is not defined`);
	}
	if (tokens[1] === "=" && tokens.length > 3) {
		const result = this.input(tokens.slice(2).join(" "));
		return this.input(`${tokens.slice(0, 2).join(" ")} ${result}`);
	}
	return this.calc(expression);
};
