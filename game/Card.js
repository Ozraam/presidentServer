export class Card {
    constructor(rank, suit, value) {
        this.rank = rank;
        this.suit = suit;
        this.value = value;
    }

    equals(card) {
        return this.rank === card.rank && this.suit === card.suit;
    }

    getRank() {
        return this.rank;
    }

    getSuit() {
        return this.suit;
    }

    greaterThan(card) {
        return this.value > card.value;
    }

    lessThan(card) {
        return this.value < card.value;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }
}