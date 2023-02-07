import { Card } from './Card.js';
import { ranks } from './Enum.js';

export class Round {

    cardOrNothing = false;

    constructor(numberOfCards) {
        this.cards = [];
        this.numberOfCards = numberOfCards;
    }

    playCards(cards) {
        if(!this.canPlayCards(cards)) return false;
       
        this.cards = this.cards.concat(cards);

        if(this.numberOfCards == 1 && this.cards.length >= 2) {
            this.cardOrNothing = this.cards[this.cards.length - 1].rank == this.cards[this.cards.length - 2].rank;
        }

        return true;
    }

    canPlayCards(cards) {
        if(cards.length == this.numberOfCards) {
            if(this.numberOfCards == 1 && this.cardOrNothing && this.cards.length > 0 && this.cards[this.cards.length - 1].rank != cards[0].rank) return false;
            if(this.cards.length > 0 && this.cards[this.cards.length - 1].value > cards[0].value) return false;
            return true;
        }

        return false;
    }

    setCardOrNothing(cardOrNothing) {
        this.cardOrNothing = cardOrNothing;
    }

    /**
     * 
     * @param {Card[]} hand 
     * @returns {boolean}
     */
    canSteal(hand) {
        if(this.numberOfCards == 3) return false;
        if(this.cards.length == 0) return false;

        const rankToLook = this.cards[this.cards.length - 1].rank;

        let totalNumberOfLastCard = hand.filter(card => card.rank == rankToLook).length + this.cards.filter(card => card.rank == rankToLook).length;

        return totalNumberOfLastCard == 4;
    }

    /**
     * 
     * @param {Card[]} hand 
     * @returns {string | undefined} rank of stolen cards
     */
    steal(hand) {
        if(this.canSteal(hand)) {
            let rankToLook = this.cards[this.cards.length - 1].rank;
            let cardsToSteal = hand.filter(card => card.rank == rankToLook);
            this.cards = this.cards.concat(cardsToSteal);
            return rankToLook;
        }
        return undefined;
    }

    isPileFinish() {
        if(this.cards.length == 0) return false;

        let lastCard = this.cards[this.cards.length - 1];
        if(lastCard.rank == ranks[2].name) return true;

        if(this.cards.length < 4) return false;

        let lastFourCards = this.cards.slice(this.cards.length - 4);
        for(let i = 0; i < lastFourCards.length - 2; i++) {
            if(lastFourCards[i].rank != lastFourCards[i + 1].rank) return false;
        }
        return true;
    }
}
