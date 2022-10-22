function factorial(number: number) {
	let result = 1;
	while (number > 1) result *= number--;
	return result;
}

function combination(n: number, r: number) {
	return factorial(n) / (factorial(r) * factorial(n - r));
}

function calc(expression: string) {
	const expr = expression.split("^")[0].replace(/[()]/g, "");
	const raisedTo = +expression.split("^")[1];
	const variable = expression.match(/[a-z]/)?.[0]!;
	const a = +(expr.split(variable)[0] === "-" ? -1 : expr.split(variable)[0]) || 1;
	const b = +expr.split(variable)[1];
	let i = 0;
	let resultArray = [];
	while (i <= raisedTo) {
		const comb = combination(raisedTo, i);
		const mul = Math.pow(a, raisedTo - i) * Math.pow(b, i) * comb;
		const x = raisedTo - i > 1 ? `${variable}^${raisedTo - i}` : raisedTo - i === 1 ? variable : "";
		i++;
		if (mul === 0) continue;
		resultArray.push(mul === 1 && x ? x : mul === -1 && x ? `-${x}` : mul + x);
	}
	let result = "";
	resultArray.forEach((ele, ind) => {
		result += ind === 0 || ele.startsWith("-") ? ele : `+${ele}`;
	});
	return result;
}

calc("(-n-12)^5");
