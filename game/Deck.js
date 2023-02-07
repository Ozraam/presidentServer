import { Card } from './Card.js';

export class Deck {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard(card) {
        this.cards = this.cards.filter(c => !c.equals(card));
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        return this.cards.pop();
    }

    getCards() {
        return this.cards;
    }

    getCardCount() {
        return this.cards.length;
    }

    toString() {
        return this.cards.join(', ');
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    deal(players, cardsPerPlayer) {
        for (let i = 0; i < cardsPerPlayer; i++) {
            for (let player of players) {
                player.deck.addCard(this.drawCard());
            }
        }
    }

    dealAll(players) {
        while (!this.isEmpty()) {
            for (let player of players) {
                player.deck.addCard(this.drawCard());
                if(this.isEmpty()) break;
            }
        }
    }

    sort() {
        this.cards.sort((a, b) => a.value - b.value);
    }

    static createDeck() {
        const deck = new Deck();
        const suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace', '2'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        for (let i = 0; i < suits.length; i++) {
            for (let j = 0; j < ranks.length; j++) {
                deck.addCard(new Card(ranks[j], suits[i], values[j]));
            }
        }
        return deck;
    }

    hasCard(card) {
        return this.cards.some(c => c.equals(card));
    }

    clear() {
        this.cards = [];
    }
}