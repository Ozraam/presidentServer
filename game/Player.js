import { PlayerRank } from "./Enum.js";
import { Deck } from "./Deck.js";

export class Player {
    
    constructor(name) {
        this.finish = false;
        this.name = name;
        this.deck = new Deck();
        this.rank = PlayerRank.NEUTRAL;
    }

    giveCardTo(player, card) {
        this.deck.removeCard(card);
        player.deck.addCard(card);
    }

    getDeck() {
        return this.deck;
    }

    getRank() {
        return this.rank;
    }

    setRank(rank) {
        this.rank = rank;
    }

    getName() {
        return this.name;
    }

    toString() {
        return this.name;
    }

    bestCard() {
        return this.deck.getCards().sort((a, b) => b.value - a.value)[0];
    }

    bestCards(n) {
        return this.deck.getCards().sort((a, b) => b.value - a.value).slice(0, n);
    }
    /**
     * 
     * @param {number} n 
     * @returns {Card[][]}
     */
    getCardsByPair(n) {
        let cards = this.deck.getCards().slice();
        let cardsByPair = [];
        while(cards.length > 0) {
            let card = cards.shift();
            let pair = [card, ...cards.filter(c => c.rank == card.rank)];
            if(pair.length >= n) {
                pair = pair.slice(0, n);
                cardsByPair.push(pair);
                cards = cards.filter(c => !pair.includes(c));
            }
        }
        return cardsByPair;
    }

    clearDeck() {
        this.deck.clear();
    }
}