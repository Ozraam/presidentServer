import { Player } from './Player.js';
import { Deck } from './Deck.js';
import { PlayerRank, ranks, suit } from './Enum.js';
import { Card } from './Card.js';
import { Round } from './Round.js';

export class PresidentGame {
    vicePresGiven = false;
    presGiven = false;

    viceLooserGiven = false;
    looserGiven = false;

    started = false;
    finished = false;

    /** @type {Round} */
    currentPlayer = null;

    winnerBrackets = [];
    looserBrackets = [];

    nPass = 0;
    

    constructor() {
        this.players = [];
        this.currentRound = null;
    }
    /**
     * add a player to the game
     * @param {Player} player 
     */
    addPlayer(player) {
        this.players.push(player);
    }

    setup() {
        if(this.players.length < 4) return false;

        const deck = Deck.createDeck();

        this.players.forEach(player => player.clearDeck());

        // shuffle the deck
        deck.shuffle();

        // deal the cards
        deck.dealAll(this.players);

        if(!this.players.some(player => player.rank == PlayerRank.LOSER)) {
            // set the first player as the one with the queen of hearts
            const queenOfHearts = new Card(ranks.QUEEN.name,suit.HEARTS, ranks.QUEEN.value);

            for(let player of this.players) {
                if(player.deck.hasCard(queenOfHearts)) {
                    this.currentPlayer = player;
                    this.viceLooserGiven = true;
                    this.looserGiven = true;
                    this.vicePresGiven = true;
                    this.presGiven = true;
                    break;
                }
            }
        } else {
            this.currentPlayer = this.players.filter(player => player.rank == PlayerRank.LOSER)[0];
        }

        this.finished = false;
    }

    canStart() {
        return this.viceLooserGiven && this.looserGiven && this.vicePresGiven && this.presGiven && !this.finished;
    }

    looserGive() {
        if(this.looserGiven) return false;

        let looser = this.players.filter(player => player.rank == PlayerRank.LOSER)[0];

        let bestCards = looser.bestCards(2);

        let president = this.players.filter(player => player.rank == PlayerRank.PRESIDENT)[0]
        looser.giveCardTo(president, bestCards[0]);
        looser.giveCardTo(president, bestCards[1]);

        this.looserGiven = true;

        return true;
    }

    viceLooserGive() {
        if(this.viceLooserGiven) return false;

        let looser = this.players.filter(player => player.rank == PlayerRank.VICE_LOSER)[0];

        let bestCards = looser.bestCards(1);

        let president = this.players.filter(player => player.rank == PlayerRank.VICE_PRESIDENT)[0]
        looser.giveCardTo(president, bestCards[0]);

        this.viceLooserGiven = true;

        return true;
    }

    vicePresidentGive(cards) {
        if(cards.length != 1) return false;
        if(this.vicePresGiven) return false;

        let vicePresident = this.players.filter(player => player.rank == PlayerRank.VICE_PRESIDENT)[0];

        let viceLooser = this.players.filter(player => player.rank == PlayerRank.VICE_LOSER)[0]

        vicePresident.giveCardTo(viceLooser, cards[0]);

        this.vicePresGiven = true;

        return true;
    }

    presidentGive(cards) {
        if(cards.length != 2) return false;
        if(this.presGiven) return false;

        let president = this.players.filter(player => player.rank == PlayerRank.PRESIDENT)[0];

        let looser = this.players.filter(player => player.rank == PlayerRank.LOSER)[0]

        president.giveCardTo(looser, cards[0]);
        president.giveCardTo(looser, cards[1]);

        this.presGiven = true;
        
        return true;
    }



    start(cards, player) {
        if(!this.canStart()) return false;
        console.log('Game can start');
        if(player != this.currentPlayer) return false;
        console.log('Player is current player');

        if(!cards.every(card => player.deck.hasCard(card))) return false;
        console.log('Player has all cards');
        if(!cards.every(card => card.rank == cards[0].rank)) return false;
        console.log('Cards are all the same rank');

        console.log('Game started');
        this.started = true;

        this.currentRound = new Round(cards.length);

        if(this.currentRound.playCards(cards, player)) cards.forEach(card => player.deck.removeCard(card));
        else {
            console.log('Game not started');
            this.started = false;
            this.currentRound = null;
            return false
        };

        if(this.checkPlayerFinish(player, cards)) return true;


        if(this.currentRound.isPileFinish()) {
            this.endRound();
            return true;
        }

        this.nPass = 0;

        this.currentPlayer = this.nextPlayer(player);

        return true;
    }

    nextPlayer(player) {
        let index = this.players.indexOf(player) + 1;
        while(this.players[index % this.players.length].finish) index++;

        return this.players[index % this.players.length];
    }

    /**
     * 
     * @param {Card[]} cards 
     * @param {Player} player 
     * @returns 
     */
    playCards(cards, player) {
        if(!this.started) return false;
        
        if(player != this.currentPlayer) return false;
        
        if(!cards.every(card => player.deck.hasCard(card))) return false;
        
        if(!cards.every(card => card.rank == cards[0].rank)) return false;

        if(this.currentRound.playCards(cards, player)) cards.forEach(card => player.deck.removeCard(card));
        else return false;

        if(this.checkPlayerFinish(player, cards)) return true;

        

        if(this.currentRound.isPileFinish()) {
            this.endRound();
            return true;
        }

        this.currentPlayer = this.nextPlayer(player);

        this.nPass = 0;

        return true;
    }


    /**
     * 
     * @param {Player} player 
     * @param {Card[]} cards 
     * @returns {boolean} if the round or game is finished
     */
    checkPlayerFinish(player, cards) {
        if(player.deck.getCards().length == 0) {
            player.finish = true;
            
            if(cards[0].rank == ranks[2].name) {
                this.looserBrackets.push(player);
                this.currentPlayer = this.nextPlayer(player);
                this.endRound();
                return true;
            } else {
                this.winnerBrackets.push(player);
            }

            if(this.winnerBrackets.length == 1) {
                this.endRound();
                this.currentPlayer = this.nextPlayer(player);
                return true;
            }

            if(this.winnerBrackets.length + this.looserBrackets.length == this.players.length - 1) {
                this.endGame();
                return true;
            }

        }

        return false;
    }




    /**
     * 
     * @returns {Player | undefined} player who can steal cards
     */
    getAnyoneCanSteal() {
        if(!this.started) return undefined;
        return this.players.filter(player => this.currentRound.canSteal(player.deck.getCards()))[0];
    }

    stealCards(player) {
        if(!this.started) return false;
        if(!this.getAnyoneCanSteal() == player) return false;

        let cardRemoved = this.currentRound.steal(player.deck.getCards());
        let sameCard = player.deck.cards.filter(card => card.rank == cardRemoved);
        sameCard.forEach(card => player.deck.removeCard(card));
        this.currentPlayer = player;

        if(this.checkPlayerFinish(player, sameCard)) return true;

        this.endRound();

        return true;
    }

    pass(player) {
        if(!this.started) return false;
        if(player != this.currentPlayer) return false;

        this.nPass++;
        if(this.nPass == this.players.length - this.players.filter(player => player.finish).length) {
            this.endRound();
            

            return true;
        }

        this.currentRound.setCardOrNothing(false);

        this.currentPlayer = this.nextPlayer(player);

        return true;
    }

    endRound() {
        this.currentRound = null;
        this.started = false;
    }

    endGame() {
        this.winnerBrackets.push(this.players.filter(player => !player.finish)[0]);
        this.winnerBrackets = this.winnerBrackets.concat(this.looserBrackets);

        this.winnerBrackets[0].rank = PlayerRank.PRESIDENT;
        this.winnerBrackets[1].rank = PlayerRank.VICE_PRESIDENT;
        this.winnerBrackets[this.winnerBrackets.length - 2].rank = PlayerRank.VICE_LOSER;
        this.winnerBrackets[this.winnerBrackets.length - 1].rank = PlayerRank.LOSER;

        this.started = false;
        this.finished = true;
        this.currentRound = null;


    }

    canPairsBePlayed(pairs) {
        if(!this.started) return pairs;
        return pairs.filter(pair => this.currentRound.canPlayCards(pair));
    }
}