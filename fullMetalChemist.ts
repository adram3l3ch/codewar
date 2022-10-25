type Molecular = { [key: string]: [number, number] };
type ObjectType = { [key: string]: number };
type BounderParamType = [number, number, number, number];
type MutateParamType = [number, number, string];

const molecular: Molecular = {
	H: [1, 1.0],
	B: [3, 10.8],
	C: [4, 12.0],
	N: [3, 14.0],
	O: [2, 16.0],
	F: [1, 19.0],
	Mg: [2, 24.3],
	P: [3, 31.0],
	S: [2, 32.1],
	Cl: [1, 35.5],
	Br: [1, 80.0],
};

const sortOrder = {
	C: 0,
	O: 100,
	B: 200,
	Br: 300,
	Cl: 400,
	F: 500,
	Mg: 600,
	N: 700,
	P: 800,
	S: 900,
	H: 1000,
} as ObjectType;

//errors

class InvalidBond extends Error {
	constructor() {
		super("InvalidBond");
	}
}
class UnlockedMolecule extends Error {
	constructor() {
		super("UnlockedMolecule");
	}
}
class LockedMolecule extends Error {
	constructor() {
		super("LockedMolecule");
	}
}
class EmptyMolecule extends Error {
	constructor() {
		super("EmptyMolecule");
	}
}

//Atom

class Atom {
	#valency: number;
	element: string;
	id: number;
	outerBond: boolean;
	bonds: Atom[] = [];

	constructor(elt: string, id: number, outerBond = false) {
		this.element = elt;
		this.id = id;
		this.outerBond = outerBond;
		this.#valency = molecular[elt][0];
	}

	addBond(atom: Atom) {
		const isAtomsValence = this.bonds.length === this.#valency || atom.bonds.length === atom.#valency;
		if (isAtomsValence || atom.id === this.id) throw new InvalidBond();
		this.bonds.push(atom);
		atom.bonds.push(this);
	}

	mutate(elt: string) {
		const eltValency = molecular[elt][0];
		if (this.bonds.length > eltValency) throw new InvalidBond();
		this.element = elt;
		this.#valency = eltValency;
	}

	close(startId: number) {
		const remainingHoles = this.#valency - this.bonds.length;
		const atoms: Atom[] = [];
		for (let i = 0; i < remainingHoles; i++) {
			const atom = new Atom("H", startId + i, this.outerBond);
			this.addBond(atom);
			atoms.push(atom);
		}
		return atoms;
	}

	unlock() {
		this.bonds = this.bonds.filter(atom => atom.element !== "H");
	}

	toString() {
		const bonds = [...this.bonds];
		bonds.sort((a, b) => {
			const aPriority = sortOrder[a.element];
			const bPriority = sortOrder[b.element];
			if (aPriority < bPriority) return -1;
			if (aPriority === bPriority && a.id < b.id) return -1;
			return 1;
		});
		const _bonds = bonds.map(atom => (atom.element === "H" ? "H" : `${atom.element}${atom.id}`));
		const all = _bonds.join(",");
		return `Atom(${this.element}.${this.id}${all ? `: ${all}` : ""})`;
	}
}

//Molecule

class Molecule {
	name: string;
	branches: Atom[][] = [];
	nonBranches: Atom[] = [];
	#isClosed = false;
	#form = {} as ObjectType;
	constructor(name = "") {
		this.name = name;
	}

	brancher(...counts: number[]) {
		if (this.#isClosed) throw new LockedMolecule();
		counts.forEach(count => {
			const startId = [...this.branches, ...this.nonBranches].flat().length + 1;
			const atoms: Atom[] = [];
			for (let i = 0; i < count; i++) {
				const atom = new Atom("C", startId + i);
				atoms.push(atom);
				atoms[i - 1] && atom.addBond(atoms[i - 1]);
			}
			this.branches.push(atoms);
		});
		return this;
	}

	bounder(...lists: BounderParamType[]) {
		if (this.#isClosed) throw new LockedMolecule();
		lists.forEach(list => {
			const [c1, b1, c2, b2] = list.map(ele => ele - 1);
			this.branches[b1][c1].addBond(this.branches[b2][c2]);
		});
		return this;
	}
	add(...lists: MutateParamType[]) {
		if (this.#isClosed) throw new LockedMolecule();
		const startId = [...this.branches, ...this.nonBranches].flat().length + 1;
		lists.forEach((list, i) => {
			const [c, b, elt] = list;
			const atom = new Atom(elt, startId + i, true);
			this.branches[b - 1][c - 1].addBond(atom);
			this.nonBranches.push(atom);
		});
		return this;
	}
	addChaining(c: number, b: number, ...elts: string[]) {
		if (this.#isClosed) throw new LockedMolecule();
		const startId = [...this.branches, ...this.nonBranches].flat().length + 1;
		let atom = new Atom(elts[0], startId, true);
		const atoms = [atom];
		elts.forEach((elt, i) => {
			if (i === 0) return;
			const newAtom = new Atom(elt, startId + i, true);
			atom.addBond(newAtom);
			atoms.push(newAtom);
			atom = newAtom;
		});
		this.branches[b - 1][c - 1]?.addBond(atoms[0]);
		this.nonBranches.push(...atoms);
		return this;
	}

	mutate(...lists: MutateParamType[]) {
		if (this.#isClosed) throw new LockedMolecule();
		lists.forEach(list => {
			const [c, b, elt] = list;
			this.branches[b - 1][c - 1].mutate(elt);
		});
		return this;
	}

	closer() {
		if (this.#isClosed) throw new LockedMolecule();
		this.branches.forEach(branch => {
			let startId = [...this.branches, ...this.nonBranches].flat().length + 1;
			let atoms: Atom[] = [];
			branch.forEach(atom => {
				const newAtoms = atom.close(startId);
				startId += newAtoms.length;
				atoms.push(...newAtoms);
			});
			branch.push(...atoms);
		});
		let atoms: Atom[] = [];
		let startId = [...this.branches, ...this.nonBranches].flat().length + 1;
		this.nonBranches.forEach(atom => {
			const newAtoms = atom.close(startId);
			startId += newAtoms.length;
			atoms.push(...newAtoms);
		});
		this.nonBranches.push(...atoms);
		this.#isClosed = true;
		this.#findFormula();
		return this;
	}

	unlock() {
		if (!this.#isClosed) throw new UnlockedMolecule();
		if (!this.branches.flat().length) throw new EmptyMolecule();

		const filterBranch = (branch: Atom[], id: number) => {
			return branch.filter(_atom => {
				const _id = _atom.id;
				if (_id > id) _atom.id = _atom.id - 1;
				_atom.unlock();
				return _id !== id;
			});
		};

		[...this.branches, ...this.nonBranches].flat().forEach(atom => {
			if (atom.element === "H") {
				this.nonBranches = filterBranch(this.nonBranches, atom.id);
				this.branches.forEach((branch, i) => {
					this.branches[i] = filterBranch(branch, atom.id);
				});
			}
		});

		this.branches = this.branches.filter(branch => branch.length);
		this.#isClosed = false;
		this.#form = {};
		if (this.branches.flat().length === 0) throw new EmptyMolecule();
		return this;
	}

	#findFormula() {
		[...this.branches, ...this.nonBranches].flat().forEach(atom => {
			const { element } = atom;
			this.#form[element] = this.#form[element] + 1 || 1;
		});
	}

	get formula() {
		if (!this.#isClosed) throw new UnlockedMolecule();
		let formula = "";
		const keys = Object.keys(this.#form)
			.filter(ele => !["C", "H", "O"].includes(ele))
			.sort((a, b) => (a > b ? 1 : -1));
		keys.unshift("C", "H", "O");
		keys.forEach(
			key => this.#form[key] && (formula += this.#form[key] === 1 ? key : `${key}${this.#form[key]}`)
		);
		return formula;
	}

	get molecularWeight() {
		if (!this.#isClosed) throw new UnlockedMolecule();
		const weight = Object.keys(this.#form).reduce(
			(acc, ele) => acc + this.#form[ele] * molecular[ele][1],
			0
		);
		return weight;
	}

	get atoms() {
		return [...this.branches, ...this.nonBranches].flat().sort((a, b) => a.id - b.id);
	}
}
