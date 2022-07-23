class Database {
	constructor(db) {
		this.db = db;
	}

	objectFromEntries(entries) {
		const result = {};
		entries.map(([key, value]) => {
			result[key] = value;
		});
		return result;
	}

	select(columns, table) {
		const results = table.map(item => {
			const result = {};
			columns.map(column => {
				result[column] = item[column];
			});
			return result;
		});
		return results;
	}

	compare(LHS, comparator, RHS) {
		switch (comparator) {
			case "=":
				return LHS == RHS;
			case "<>":
				return LHS != RHS;
			case ">":
				return +LHS > +RHS;
			case ">=":
				return +LHS >= +RHS;
			case "<":
				return +LHS < +RHS;
			case "<=":
				return +LHS <= +RHS;
		}
	}

	where(db, condition) {
		if (!condition) return db;
		const [LHS, comparator] = condition.split(" ");
		let RHS = [];
		// const RHS = condition.split(" ").slice(2).join(" ").replaceAll(/['"]/g, "");
		const replaceQuotes = string => {
			string = string + "";
			const arr = [];
			string.split("").map(i => {
				if (i === "'" || i === '"') return;
				arr.push(i);
			});
			return arr.join("");
		};
		RHS = replaceQuotes(condition.split(" ").slice(2).join(" "));
		const results = db.filter(item => this.compare(replaceQuotes(item[LHS]), comparator, RHS));
		return results;
	}

	join(PTable, PTableName, JTableName, LHS, comp, RHS) {
		if (!PTable) {
			PTable = this.db[PTableName];
			let PTableEntries = PTable.map(item =>
				Object.entries(item).map(([key, value]) => [`${PTableName}.${key}`, value])
			);
			PTable = PTableEntries.map(entry => this.objectFromEntries(entry));
		}
		if (!JTableName) return PTable;
		let JTable = this.db[JTableName];
		let JTableEntries = JTable.map(item =>
			Object.entries(item).map(([key, value]) => [`${JTableName}.${key}`, value])
		);
		JTable = JTableEntries.map(entry => this.objectFromEntries(entry));
		const bigArray = PTable.length > JTable.length ? PTable : JTable;
		const smallArray = PTable.length < JTable.length ? PTable : JTable;
		const results = bigArray.map(item => {
			const matchingItem = smallArray.find(ele =>
				ele[LHS] ? this.compare(ele[LHS], comp, item[RHS]) : this.compare(ele[RHS], comp, item[LHS])
			);
			return { ...matchingItem, ...item };
		});
		return results;
	}

	joinArray(join, parentTableName) {
		let joined = null;
		if (!join.length) joined = this.join(joined, parentTableName);
		join.forEach(item => {
			const [joinTableName, condition] = item.split(/ ON /i);
			const [LHS, comparator, RHS] = condition.split(" ");
			joined = this.join(joined, parentTableName, joinTableName, LHS, comparator, RHS);
		});
		return joined;
	}

	execute(query) {
		const columns = query
			.split(/SELECT /i)
			.slice(1)
			.join("")
			.split(/FROM /i)[0]
			.split(",")
			.map(e => e.trim());
		const parentTableName = query.split(/ FROM /i)[1].split(" ")[0];
		const join = query
			.split(/ JOIN /i)
			.filter(
				item =>
					!item.startsWith("SELECT") &&
					!item.startsWith("WHERE") &&
					!item.startsWith("where") &&
					!item.startsWith("select")
			);
		const joined = this.joinArray(join, parentTableName);
		const where = query.split(/WHERE /i)[1];
		const filtered = this.where(joined, where);
		return this.select(columns, filtered);
	}
}

const mdb = {
	movie: [
		{ id: 1, title: "The A-Team", year: 2010, directorID: 1 },
		{ id: 2, title: "Avatar", year: 2009, directorID: 2 },
		{ id: 3, title: "Titanic", year: 1997, directorID: 2 },
		{ id: 4, title: "The Avengers", year: 2012, directorID: 3 },
		{ id: 5, title: "Iron Man 3", year: 2013, directorID: 4 },
		{ id: 6, title: "Iron Man", year: 2008, directorID: 5 },
		{ id: 7, title: "The Lord of the Rings: The Return of the King", year: 2003, directorID: 6 },
		{ id: 8, title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, directorID: 6 },
		{ id: 9, title: "The Lord of the Rings: The Two Towers", year: 2002, directorID: 6 },
		{ id: 10, title: "Skyfall", year: 2012, directorID: 7 },
		{ id: 11, title: "The Dark Knight Rises", year: 2012, directorID: 8 },
		{ id: 12, title: "The Dark Knight", year: 2008, directorID: 8 },
		{ id: 13, title: "Pirates of the Caribbean: Dead Man's Chest", year: 2006, directorID: 9 },
		{ id: 14, title: "Toy Story 3", year: 2010, directorID: 10 },
		{ id: 15, title: "E.T. the Extra-Terrestrial", year: 1982, directorID: 11 },
		{ id: 16, title: "Toy Story", year: 1995, directorID: 12 },
		{ id: 17, title: "Pirates of the Caribbean: On Stranger Tides", year: 2011, directorID: 13 },
		{ id: 18, title: "Jurassic Park", year: 1993, directorID: 11 },
	],
	director: [
		{ id: 1, name: "Joe Carnahan" },
		{ id: 2, name: "James Cameron" },
		{ id: 3, name: "Joss Whedon" },
		{ id: 4, name: "Shane Black" },
		{ id: 5, name: "Jon Favreau" },
		{ id: 6, name: "Peter Jackson" },
		{ id: 7, name: "Sam Mendes" },
		{ id: 8, name: "Christopher Nolan" },
		{ id: 9, name: "Gore Verbinski" },
		{ id: 10, name: "Lee Unkrich" },
		{ id: 11, name: "Steven Spielberg" },
		{ id: 12, name: "John Lasseter" },
		{ id: 13, name: "Rob Marshall" },
	],
	actor: [
		{ id: 1, name: "Liam Neeson" },
		{ id: 2, name: "Bradley Cooper" },
		{ id: 3, name: "Jessica Biel" },
		{ id: 4, name: "Quinton 'Rampage' Jackson" },
		{ id: 5, name: "Sam Worthington" },
		{ id: 6, name: "Zoe Saldana" },
		{ id: 7, name: "Sigourney Weaver" },
		{ id: 8, name: "Stephen Lang" },
		{ id: 9, name: "Leonardo DiCaprio" },
		{ id: 10, name: "Kate Winslet" },
		{ id: 11, name: "Billy Zane" },
		{ id: 12, name: "Kathy Bates" },
		{ id: 13, name: "Robert Downey Jr." },
		{ id: 14, name: "Chris Evans" },
		{ id: 15, name: "Mark Ruffalo" },
		{ id: 16, name: "Chris Hemsworth" },
		{ id: 17, name: "Gwyneth Paltrow" },
		{ id: 18, name: "Don Cheadle" },
		{ id: 19, name: "Guy Pearce" },
		{ id: 20, name: "Terrence Howard" },
		{ id: 21, name: "Jeff Bridges" },
		{ id: 22, name: "Noel Appleby" },
		{ id: 23, name: "Alexandra Astin" },
		{ id: 24, name: "Sean Astin" },
		{ id: 25, name: "David Aston" },
		{ id: 26, name: "Alan Howard" },
		{ id: 27, name: "Elijah Wood" },
		{ id: 28, name: "Bruce Allpress" },
		{ id: 29, name: "John Bach" },
		{ id: 30, name: "Sala Baker" },
		{ id: 31, name: "Daniel Craig" },
		{ id: 32, name: "Judi Dench" },
		{ id: 33, name: "Javier Bardem" },
		{ id: 34, name: "Ralph Fiennes" },
		{ id: 35, name: "Christian Bale" },
		{ id: 36, name: "Gary Oldman" },
		{ id: 37, name: "Tom Hardy" },
		{ id: 38, name: "Joseph Gordon-Levitt" },
		{ id: 39, name: "Heath Ledger" },
		{ id: 40, name: "Aaron Eckhart" },
		{ id: 41, name: "Michael Caine" },
		{ id: 42, name: "Johnny Depp" },
		{ id: 43, name: "Orlando Bloom" },
		{ id: 44, name: "Keira Knightley" },
		{ id: 45, name: "Jack Davenport" },
		{ id: 46, name: "Tom Hanks" },
		{ id: 47, name: "Tim Allen" },
		{ id: 48, name: "Joan Cusack" },
		{ id: 49, name: "Ned Beatty" },
		{ id: 50, name: "Dee Wallace" },
		{ id: 51, name: "Henry Thomas" },
		{ id: 52, name: "Peter Coyote" },
		{ id: 53, name: "Robert MacNaughton" },
		{ id: 54, name: "Don Rickles" },
		{ id: 55, name: "Jim Varney" },
		{ id: 56, name: "Penélope Cruz" },
		{ id: 57, name: "Geoffrey Rush" },
		{ id: 58, name: "Ian McShane" },
		{ id: 59, name: "Sam Neill" },
		{ id: 60, name: "Laura Dern" },
		{ id: 61, name: "Jeff Goldblum" },
		{ id: 62, name: "Richard Attenborough" },
	],
	actor_to_movie: [
		{ actorID: 1, movieID: 1 },
		{ actorID: 2, movieID: 1 },
		{ actorID: 3, movieID: 1 },
		{ actorID: 4, movieID: 1 },
		{ actorID: 5, movieID: 2 },
		{ actorID: 6, movieID: 2 },
		{ actorID: 7, movieID: 2 },
		{ actorID: 8, movieID: 2 },
		{ actorID: 9, movieID: 3 },
		{ actorID: 10, movieID: 3 },
		{ actorID: 11, movieID: 3 },
		{ actorID: 12, movieID: 3 },
		{ actorID: 13, movieID: 4 },
		{ actorID: 13, movieID: 5 },
		{ actorID: 13, movieID: 6 },
		{ actorID: 14, movieID: 4 },
		{ actorID: 15, movieID: 4 },
		{ actorID: 16, movieID: 4 },
		{ actorID: 17, movieID: 5 },
		{ actorID: 17, movieID: 6 },
		{ actorID: 18, movieID: 5 },
		{ actorID: 19, movieID: 5 },
		{ actorID: 20, movieID: 6 },
		{ actorID: 21, movieID: 6 },
		{ actorID: 22, movieID: 7 },
		{ actorID: 22, movieID: 8 },
		{ actorID: 23, movieID: 7 },
		{ actorID: 24, movieID: 7 },
		{ actorID: 24, movieID: 8 },
		{ actorID: 24, movieID: 9 },
		{ actorID: 25, movieID: 7 },
		{ actorID: 26, movieID: 8 },
		{ actorID: 27, movieID: 8 },
		{ actorID: 28, movieID: 9 },
		{ actorID: 29, movieID: 9 },
		{ actorID: 30, movieID: 9 },
		{ actorID: 31, movieID: 10 },
		{ actorID: 32, movieID: 10 },
		{ actorID: 33, movieID: 10 },
		{ actorID: 34, movieID: 10 },
		{ actorID: 35, movieID: 11 },
		{ actorID: 35, movieID: 12 },
		{ actorID: 36, movieID: 11 },
		{ actorID: 37, movieID: 11 },
		{ actorID: 38, movieID: 11 },
		{ actorID: 39, movieID: 12 },
		{ actorID: 40, movieID: 12 },
		{ actorID: 41, movieID: 12 },
		{ actorID: 42, movieID: 13 },
		{ actorID: 42, movieID: 17 },
		{ actorID: 43, movieID: 13 },
		{ actorID: 44, movieID: 13 },
		{ actorID: 45, movieID: 13 },
		{ actorID: 46, movieID: 14 },
		{ actorID: 46, movieID: 16 },
		{ actorID: 47, movieID: 14 },
		{ actorID: 47, movieID: 16 },
		{ actorID: 48, movieID: 14 },
		{ actorID: 49, movieID: 14 },
		{ actorID: 50, movieID: 15 },
		{ actorID: 51, movieID: 15 },
		{ actorID: 52, movieID: 15 },
		{ actorID: 53, movieID: 15 },
		{ actorID: 54, movieID: 16 },
		{ actorID: 55, movieID: 16 },
		{ actorID: 56, movieID: 17 },
		{ actorID: 57, movieID: 17 },
		{ actorID: 58, movieID: 17 },
		{ actorID: 59, movieID: 18 },
		{ actorID: 60, movieID: 18 },
		{ actorID: 61, movieID: 18 },
		{ actorID: 62, movieID: 18 },
	],
};

const db = new Database(mdb);

// console.log(db.where(["movie.name", "Aliens"], movieNames));
// console.log(db.join("director", "movie", ["id", "directorID"]));

const a = db.execute(
	"SELECT movie.title FROM movie WHERE movie.title = 'Pirates of the Caribbean: Dead Man's Chest'"
);

console.log(a);
