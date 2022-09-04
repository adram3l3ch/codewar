const operators = ["-", "+", "*", "/"];
function calcSingleOperation(num1, operator, num2) {
	switch (operator) {
		case "+":
			return +num1 + +num2;
		case "-":
			return +num1 - +num2;
		case "*":
			return +num1 * +num2;
		case "/":
			return +num1 / +num2;
	}
}

function getEndOfParentheses(expression) {
	let parentheses = 0;
	return (
		[...expression].reduce((acc, ele, i) => {
			if (ele === "(") parentheses++;
			if (ele === ")") parentheses--;
			if (parentheses < 0) return acc > 0 ? acc : i;
			return acc;
		}, null) + 1
	);
}

const getLeftAndRight = (expression, index) => {
	let leftStartIndex = index - 1;
	let rightStartIndex = index + 1;
	const result = {};
	while (true) {
		const char = expression[leftStartIndex];
		if (
			char === undefined ||
			(operators.includes(char) && char !== "-") ||
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
		if (char === undefined || (result.right && operators.includes(char))) break;
		if (char.match(/[\d\.-]/)) {
			result.right = (result.right || "") + char;
		}
		rightStartIndex++;
	}
	return result;
};

function calc(expression) {
	let index = 0;
	let singleOperation = [];
	const hasMulOrDiv = expression.match(/[\*/]/);
	const hasParentheses = expression.match(/\(/);
	expression = expression.replace(/(--)/g, "");
	expression = expression.replace(/(-\+)/g, "-");
	expression = expression.replace(/(\+-)/g, "-");
	expression = expression.replace(/(\+\+)/g, "+");
	if (hasParentheses) {
		index = hasParentheses.index;
		const closingIndex = getEndOfParentheses(expression.slice(index + 1));
		const result = calc(expression.slice(index + 1, closingIndex + index));
		expression = expression.slice(0, index) + result + expression.slice(closingIndex + index + 1);
		return calc(expression);
	}
	if (hasMulOrDiv) {
		const { left, right } = getLeftAndRight(expression, hasMulOrDiv.index);
		const regExp = new RegExp(`(\\s*${left}\\s*\\${hasMulOrDiv[0]}\\s*${right}\\s*)`);
		expression = expression.replace(regExp, calcSingleOperation(left, hasMulOrDiv[0], right));
		return calc(expression);
	}
	while (true) {
		const char = expression[index];
		if (char === undefined) return +expression.replace(/[\(\)]/g, "");
		if (char.match(/[\d\.]/)) {
			if (singleOperation.length === 0 || singleOperation.length === 2) singleOperation.push(char);
			else {
				const lastIndex = singleOperation.length - 1;
				singleOperation[lastIndex] = singleOperation[lastIndex] + char;
			}
		}
		if (operators.includes(char)) singleOperation.push(char);
		if (
			singleOperation.length === 3 &&
			!(expression[index + 1] && expression[index + 1].match(/[\d\.]/))
		) {
			const result = calcSingleOperation(...singleOperation);
			if (expression[index + 1] === undefined) return result;
			singleOperation = [result];
		}
		index++;
	}
}
