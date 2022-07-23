class Lift {
	#floors;
	constructor(queues, capacity) {
		this.#floors = { queues, currentFloor: 0 };
		this.lift = { people: [], stops: [0], isIdle: true, capacity, direction: "DOWN" };
	}

	get currentFloor() {
		return this.#floors.currentFloor;
	}

	get people() {
		return this.lift.people;
	}

	get direction() {
		return this.lift.direction;
	}

	get queues() {
		return this.#floors.queues;
	}

	get isQueueEmpty() {
		return this.#floors.queues.every(e => e.length === 0);
	}

	get isLiftFull() {
		return this.lift.people.length === this.lift.capacity;
	}

	#toggleLift() {
		this.lift.isIdle = !this.lift.isIdle;
	}

	#getAllPersonsDirection(people) {
		const everyoneGoingUp = people.every(e => e < this.currentFloor);
		const everyoneGoingDown = people.every(e => e > this.currentFloor);
		return everyoneGoingUp ? -1 : everyoneGoingDown ? 1 : 0;
	}

	#getWaitingPersonsDirection() {
		const noOneIsWaitingDown = this.queues.every((e, i) => {
			if (i <= this.currentFloor) return true;
			return e.length === 0;
		});
		const noOneIsWaitingUp = this.queues.every((e, i) => {
			if (i >= this.currentFloor) return true;
			return e.length === 0;
		});
		return noOneIsWaitingUp && noOneIsWaitingDown
			? 0
			: noOneIsWaitingUp
			? 1
			: noOneIsWaitingDown
			? -1
			: null;
	}

	#getFloorStatus() {
		const isLastFloor = this.currentFloor === this.queues.length - 1;
		const isFirstFloor = this.currentFloor === 0;
		return isFirstFloor ? -1 : isLastFloor ? 1 : 0;
	}

	#move() {
		if (this.direction === "UP") this.#floors.currentFloor--;
		else this.#floors.currentFloor++;
	}

	#changeDirection() {
		const allPersonsDirection = this.#getAllPersonsDirection(this.people);
		const waitingPersonsDirection = this.#getWaitingPersonsDirection();
		const floorStatus = this.#getFloorStatus();
		const noOneInLiftWantToGoDown = allPersonsDirection === -1 || this.people.length === 0;
		const noOneInLiftWantToGoUp = allPersonsDirection === 1 || this.people.length === 0;
		const noOneIsWaitingDown = waitingPersonsDirection === -1 || waitingPersonsDirection === 0;
		const noOneIsWaitingUp = waitingPersonsDirection === 1 || waitingPersonsDirection === 0;
		const noOneInQueueWantToGoDown = this.queues[this.currentFloor].every(e => e < this.currentFloor);
		const noOneInQueueWantToGoUp = this.queues[this.currentFloor].every(e => e > this.currentFloor);
		if (
			(noOneInLiftWantToGoDown && noOneIsWaitingDown && noOneInQueueWantToGoDown) ||
			floorStatus === 1
		) {
			this.lift.direction = "UP";
		} else if (
			(noOneInLiftWantToGoUp && noOneIsWaitingUp && noOneInQueueWantToGoUp) ||
			floorStatus === -1
		) {
			this.lift.direction = "DOWN";
		}
	}

	#stop(peopleGotInOrOut) {
		const isTherePeopleInQueueToTheDirection =
			(this.queues[this.currentFloor].some(e => e < this.currentFloor) && this.direction === "UP") ||
			(this.queues[this.currentFloor].some(e => e > this.currentFloor) && this.direction === "DOWN");

		if (peopleGotInOrOut || isTherePeopleInQueueToTheDirection) {
			if (this.currentFloor === 0 && this.lift.stops.length === 1) return;
			this.lift.stops.push(this.#floors.currentFloor);
		}
	}

	#addPersonToLift(index) {
		const person = this.queues[this.currentFloor][index];
		const wantToGoDown = person > this.currentFloor;
		const wantToGoUp = person < this.currentFloor;
		if ((this.direction === "DOWN" && wantToGoDown) || (this.direction === "UP" && wantToGoUp)) {
			this.lift.people.push(person);
			this.#floors.queues[this.currentFloor] = [
				...this.queues[this.currentFloor].slice(0, index),
				...this.queues[this.currentFloor].slice(index + 1),
			];
			return true;
		}
		return false;
	}

	#didEveryPossiblePersonGetIn() {
		const allPersonsDirection = this.#getAllPersonsDirection(this.queues[this.currentFloor]);
		return (
			(this.direction === "DOWN" && allPersonsDirection === -1) ||
			(this.direction === "UP" && allPersonsDirection === 1) ||
			this.queues[this.currentFloor].length === 0
		);
	}

	start() {
		this.#toggleLift();
		while (!this.lift.isIdle) {
			let [everyPossibleOneAreIn, peopleGotInOrOut, i] = [false, false, 0];
			let peopleGotOut = this.people.includes(this.currentFloor);
			this.lift.people = this.people.filter(e => e !== this.currentFloor);
			this.#changeDirection();
			while (!this.isLiftFull && !everyPossibleOneAreIn) {
				const peopleGotIn = this.#addPersonToLift(i);
				peopleGotInOrOut = peopleGotOut || peopleGotIn;
				peopleGotIn || i++;
				everyPossibleOneAreIn = this.#didEveryPossiblePersonGetIn();
			}
			this.#stop(peopleGotInOrOut);
			// console.log(this.lift, this.#floors);
			this.#move();
			if (!this.people.length && this.isQueueEmpty) {
				if (this.lift.stops[this.lift.stops.length - 1] !== 0) this.lift.stops.push(0);
				this.#toggleLift();
			}
		}
	}
}

const lift = new Lift(
	[
		[1, 7],
		[5, 10, 9, 9],
		[6, 0, 7],
		[12],
		[0, 12],
		[],
		[],
		[4, 8],
		[7, 9, 7],
		[],
		[1, 9, 11, 5],
		[0],
		[0, 5, 11, 10],
	],
	3
);
lift.start();
console.log(lift.lift.stops);
