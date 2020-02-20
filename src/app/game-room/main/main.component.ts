import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketClientService } from 'src/app/services/socket-client.service';
import { PlayerDataService } from 'src/app/services/player-data.service';
import { GameDataService, GameData, Card } from 'src/app/services/game-data.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

//#region String resources
const TRUMP_HIDDEN: string = "card_back";
const TRUMP_HEARTS: string = "hearts";
const TRUMP_DIAMONDS: string = "diamonds";
const TRUMP_CLUBS: string = "clubs";
const TRUMP_SPADES: string = "spades";
const TRUMP_JOKER: string = "joker";
const TRUMP_GUARANTEE: string = "guarantee";
const TRUMP_SEVENTH: string = "seventh";
const MODAL_TEMPLATE_TRUMP: string = "trump_template";
const MODAL_TEMPLATE_GAME_RESULT: string = "result_template";
//#endregion

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
	@ViewChild('openModal', { static: false }) openModal: ElementRef;
	@ViewChild('closeModal', { static: false }) closeModal: ElementRef;
	
	//#region Model binding initialisations
	bid_number: number;
	game_data: GameData;
	my_player_id: string;
	subscription: Subscription;
	amIBidding: boolean = false;
	playerBids = {};
	playerPosInfo = {};
	trump_choices = {};
	finalBidder: string;
	finalBid: string;
	my_pair_points: number = 0;
	opp_pair_points: number = 0;
	my_pair_score: number = 0;
	opp_pair_score: number = 0;
	trump_to_display: string = TRUMP_HIDDEN;
	myTurnToPlay: boolean = false;
	trumpRevealedNow: boolean = false;
	curr_hand: Card[];
	isLongPressing: boolean = false;
	curr_hand_suit: string;
	curr_hand_winning_card: number;
	modal_template: string;
	winning_message: string;
	//#endregion


	constructor(
		private playerDataService: PlayerDataService,
		private messageClient: SocketClientService,
		private gameDataService: GameDataService,
		private router: Router) { }

	ngOnInit() {
		this.setupUI();

		this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
			this.my_player_id = data.playerId;
		});

		this.gameDataService.getGameData().subscribe((game_data: GameData) => {
			this.game_data = game_data;
			this.updatePlayerPosInfo();
		});

		this.messageClient.gameEvents.subscribe(data => this.handleGameEvents(data));

		// this.setupMockDataForTest();
	}

	setupMockDataForTest() {
		this.playerPosInfo[10] = {
			name: "pod marani"
		}
		this.playerPosInfo[20] = {
			name: "gud marani"
		}
		this.playerPosInfo[11] = {
			name: "podur nati"
		}
		this.playerPosInfo[21] = {
			name: "gudur nati"
		}

		this.game_data.card_in_hand = [
			new Card("S", "J"),
			new Card("S", "9"),
			new Card("S", "A"),
			new Card("S", "10"),
			new Card("S", "K"),
			new Card("S", "Q"),
			new Card("S", "8"),
			new Card("S", "7", false)
		]

		this.curr_hand = [	new Card("C", "2", false, false), 
							new Card("S", "2", false, false), 
							new Card("D", "2", false, false), 
							new Card("H", "2", false, false), ];

		setTimeout(() => { this.curr_hand_winning_card = 21}, 2000);

		this.myTurnToPlay = true;
	}

	setupUI(){
		this.bid_number = 15;
		this.trump_choices["card_back"] = Card.getSpecialImage("card_back");
		this.curr_hand = [	new Card("C", "2", false, true), 
							new Card("S", "2", false, true), 
							new Card("D", "2", false, true), 
							new Card("H", "2", false, true)];
	}

	handleGameEvents(data){
		if (data.msgType == "player_card"){
			if (data.data.forPlayer == this.my_player_id){
				let validCard = false;
				if (this.game_data.card_in_hand.length == 0){
					for (var card of data.data.cards){
						console.log(card._suit, card._rank);
						let handCard = new Card(card._suit, card._rank);
						if (!this.game_data.card_in_hand.find(c => c.suit == handCard.suit && c.rank == handCard.rank)){
							this.game_data.card_in_hand.push(handCard);
							validCard = validCard || true;
						}
					}
					if (validCard)
						this.gameDataService.setGameData(this.game_data);
				}
				else{
					for (var card of data.data.cards){
						let handCard = null;
						if (this.game_data.set_seventh_trump && this.game_data.card_in_hand.length == 6)
							handCard = new Card(card._suit, card._rank, false);
						else
							handCard = new Card(card._suit, card._rank);

						if (!this.game_data.card_in_hand.find(c => c.suit == handCard.suit && c.rank == handCard.rank)){
							this.game_data.card_in_hand.push(handCard);
							validCard = validCard || true;
						}
					}
					if (validCard)
						this.gameDataService.setGameData(this.game_data);
				}
			}
		}
		else if(data.msgType == "bidding_raise"){
			if (data.data.forPlayer == this.my_player_id){
				this.bid_number = data.data.raiseTo;
				this.amIBidding = true;
			}
		}
		else if(data.msgType == "bidding_update"){
			if (data.data.bidder != this.my_player_id){
				this.playerBids[data.data.bidder].showPlayerBid = true;
				this.playerBids[data.data.bidder].playerLastBid = data.data.bid == 0 ? "Pass" : data.data.bid;
				this.bid_number = data.data.bid;
				this.updatePlayerPosInfo();
			}
		}
		else if(data.msgType == "bidding_complete"){
			if (this.game_data.pair_1.indexOf(data.data.bidding_player) != -1){
				this.finalBidder = this.game_data.pair_1_names[this.game_data.pair_1.indexOf(data.data.bidding_player)];
			}
			else{
				this.finalBidder = this.game_data.pair_2_names[this.game_data.pair_2.indexOf(data.data.bidding_player)];
			}
			this.finalBid = data.data.finalBid;
			for (var key of Object.keys(this.playerBids)){
				this.playerBids[key].showPlayerBid = false;
			}
			if (data.data.bidding_player == this.my_player_id){
				this.showTrumpModal();
			}
		}
		else if(data.msgType == "room_invalid"){
			this.router.navigate(['/main']);
		}
		else if(data.msgType == "play_card"){
			this.myTurnToPlay = (data.forPlayer == this.my_player_id);
		}
		else if(data.msgType == "player_dealt_card"){
			// use data.data.playerId, suit and rank to show card played
			// console.log(data.data.playerId, data.data.suit, data.data.rank);
			let dealtCard = new Card(data.data.suit, data.data.rank);
			if (this.isNewHandStarting()){
				this.curr_hand_suit = dealtCard.suit;
			}
			if (data.data.playerId == this.game_data.pair_1[0]){
				this.curr_hand.splice(0, 1, dealtCard);
			}
			else if (data.data.playerId == this.game_data.pair_1[1]){
				this.curr_hand.splice(2, 1, dealtCard);
			}
			else if (data.data.playerId == this.game_data.pair_2[0]){
				this.curr_hand.splice(1, 1, dealtCard);
			}
			else if (data.data.playerId == this.game_data.pair_2[1]){
				this.curr_hand.splice(3, 1, dealtCard);
			}
		}
		else if(data.msgType == "trump_revealed"){
			this.trump_to_display = data.trump;
			for (card of this.game_data.card_in_hand){
				card.isShown = true;
			}
			this.gameDataService.setGameData(this.game_data);
		}
		else if(data.msgType == "hand_complete"){
			this.game_data.pair_1_points = data.data.pair_1_points;
			this.game_data.pair_2_points = data.data.pair_2_points;
			this.my_pair_points = this.game_data.pair_1.indexOf(this.my_player_id) != -1 ? 
									this.game_data.pair_1_points : 
									this.game_data.pair_2_points;

			this.opp_pair_points = this.game_data.pair_1.indexOf(this.my_player_id) != -1 ? 
									this.game_data.pair_2_points : 
									this.game_data.pair_1_points;

			this.curr_hand_winning_card = this.game_data.pair_1.indexOf(data.data.winner) != -1 ? 
									(this.game_data.pair_1.indexOf(data.data.winner) == 0 ? 10 : 11) : 
									(this.game_data.pair_2.indexOf(data.data.winner) == 0 ? 20 : 21);

			setTimeout(() => {
				this.curr_hand_winning_card = 0;
				this.curr_hand = [	new Card("C", "2", false, true), 
									new Card("S", "2", false, true), 
									new Card("D", "2", false, true), 
									new Card("H", "2", false, true)];
			}, 1000);
		}
		else if(data.msgType == "game_complete"){
			this.showWinningModal(data.data);
		}
	}

	showWinningModal = (data) => {
		this.modal_template = MODAL_TEMPLATE_GAME_RESULT;
		this.game_data.pair_1_score = data.pair_1_score;
		this.game_data.pair_2_score = data.pair_2_score;
		this.my_pair_score = this.game_data.pair_1.indexOf(this.my_player_id) != -1 ? 
								this.game_data.pair_1_score : 
								this.game_data.pair_2_score;

		this.opp_pair_score = this.game_data.pair_1.indexOf(this.my_player_id) != -1 ? 
								this.game_data.pair_2_score : 
								this.game_data.pair_1_score;
		if (data.gameWon)
			if (this.game_data.pair_1_names.indexOf(this.finalBidder) != -1)
				if (this.game_data.pair_1.indexOf(this.my_player_id) != -1)
					this.winning_message = "Your team Won!";
				else
					this.winning_message = "Opposite team Won!";
			else
				if (this.game_data.pair_1.indexOf(this.my_player_id) != -1)
					this.winning_message = "Opposite team Won!";
				else
					this.winning_message = "Your team Won!";
		else
			if (this.game_data.pair_1_names.indexOf(this.finalBidder) != -1)
				if (this.game_data.pair_1.indexOf(this.my_player_id) != -1)
					this.winning_message = "Your team Lost!";
				else
					this.winning_message = "Opposite team Lost!";
			else
				if (this.game_data.pair_1.indexOf(this.my_player_id) != -1)
					this.winning_message = "Opposite team Lost!";
				else
					this.winning_message = "Your team Lost!";
		this.openModal.nativeElement.click();
		setTimeout(()=>{
			this.my_pair_points = 0;
			this.opp_pair_points= 0;
			this.game_data.card_in_hand = [];
			this.game_data.pair_1_points = 0;
			this.game_data.pair_2_points = 0;
			this.game_data.set_seventh_trump = false;
			this.gameDataService.setGameData(this.game_data);
			this.bid_number = 15;
			this.finalBid = null;
			this.finalBidder = null;
			this.trump_to_display = TRUMP_HIDDEN;
			this.closeModal.nativeElement.click();
		}, 2000);
	}

	showTrumpModal(){
		this.modal_template = MODAL_TEMPLATE_TRUMP;
		this.trump_choices[TRUMP_HEARTS] = Card.getSpecialImage(TRUMP_HEARTS);
		this.trump_choices[TRUMP_DIAMONDS] = Card.getSpecialImage(TRUMP_DIAMONDS);
		this.trump_choices[TRUMP_CLUBS] = Card.getSpecialImage(TRUMP_CLUBS);
		this.trump_choices[TRUMP_SPADES] = Card.getSpecialImage(TRUMP_SPADES);
		this.trump_choices[TRUMP_SEVENTH] = Card.getSpecialImage(TRUMP_SEVENTH);
		this.trump_choices[TRUMP_JOKER] = Card.getSpecialImage(TRUMP_JOKER);
		this.trump_choices[TRUMP_GUARANTEE] = Card.getSpecialImage(TRUMP_GUARANTEE);
		this.openModal.nativeElement.click();
	}

	makeBid(){
		if (this.game_data && Object.keys(this.playerBids).length){
			this.playerBids[this.my_player_id].showPlayerBid = true;
			this.playerBids[this.my_player_id].playerLastBid = this.bid_number;
			this.messageClient.makeBid(this.bid_number, this.game_data.roomId);
			this.amIBidding = false;
			this.updatePlayerPosInfo();
		}
	}

	passBid(){
		if (this.game_data && Object.keys(this.playerBids).length){
			this.playerBids[this.my_player_id].showPlayerBid = true;
			this.playerBids[this.my_player_id].playerLastBid = "Pass";
			this.messageClient.makeBid(0, this.game_data.roomId);
			this.amIBidding = false;
			this.updatePlayerPosInfo();
		}
	}

	selectTrump(selectedTrump){
		this.game_data.set_seventh_trump = (selectedTrump == TRUMP_SEVENTH);
		this.messageClient.setTrump(selectedTrump, this.game_data.roomId);
		this.gameDataService.setGameData(this.game_data);
		this.closeModal.nativeElement.click();
	}

	onLongPressing(card: Card, event){
		if (!card.isShown){
			card.isShown = true;
			this.isLongPressing = true;
		}
		return false;
	}

	onLongPressEnd(card: Card){
		if(this.isLongPressing){
			card.isShown = false;
			this.isLongPressing = false;
		}
	}

	isNewHandStarting(){
		return this.curr_hand[0].rank == "2" && this.curr_hand[1].rank == "2" && this.curr_hand[2].rank == "2" && this.curr_hand[3].rank == "2";
	}

	isSuitInMyHand(suit: string){
		let currHandSuitInMyCards = false;
		for (var card of this.game_data.card_in_hand){
			currHandSuitInMyCards = currHandSuitInMyCards || (!card.isDealt && card.isShown && (card.suit == suit.toUpperCase()));
		}
		return currHandSuitInMyCards;
	}

	isPlayingCardValid(cardToPlay: Card){
		if (!this.isNewHandStarting()){
			if (cardToPlay.suit == this.curr_hand_suit)
				return true;
			else{
				if (this.trump_to_display == TRUMP_HIDDEN || this.trump_to_display == TRUMP_JOKER || this.trump_to_display == TRUMP_GUARANTEE){
					return !this.isSuitInMyHand(this.curr_hand_suit);
				}
				if (this.trumpRevealedNow){
					if (this.trump_to_display == TRUMP_CLUBS){
						return this.isSuitInMyHand("C") ? cardToPlay.suit == "C" : true;
					}
					else if (this.trump_to_display == TRUMP_DIAMONDS){
						return this.isSuitInMyHand("D") ? cardToPlay.suit == "D" : true;
					}
					else if (this.trump_to_display == TRUMP_HEARTS){
						return this.isSuitInMyHand("H") ? cardToPlay.suit == "H" : true;
					}
					else if (this.trump_to_display == TRUMP_SPADES){
						return this.isSuitInMyHand("S") ? cardToPlay.suit == "S" : true;
					}
				}
			}
		}
		return true;
	}

	playCard(card: Card, index: number){
		if (this.myTurnToPlay){
			if (card.isShown){
				if (this.isPlayingCardValid(card)){
					this.messageClient.dealCard(card, this.my_player_id, this.game_data.roomId);
					card.isDealt = true;
					card.isShown = false;
					this.game_data.card_in_hand.splice(index, 1, card);
					this.gameDataService.setGameData(this.game_data);
					this.trumpRevealedNow = false;
				}
				else {
					alert("Please play a valid card");
				}
			}
			else{
				alert("Can't play 7th card until trump is revealed");
			}
		}
			
	}

	showTrump(){
		if (this.myTurnToPlay && (!this.curr_hand_suit || (this.curr_hand_suit && this.isSuitInMyHand(this.curr_hand_suit)))){
			alert("Cannot reveal trump!");
		}
		else{
			this.messageClient.showTrump(this.game_data.roomId);
			this.trumpRevealedNow = true;
		}
	}

	updatePlayerPosInfo(){
		if (this.bid_number == 15){
			this.playerBids[this.game_data.pair_1[0]] = {
				showPlayerBid: false,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_2[0]] = {
				showPlayerBid: false,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_1[1]] = {
				showPlayerBid: false,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_2[1]] = {
				showPlayerBid: false,
				playerLastBid: 16
			};
		}

		for (var pos of [10,20,11,21]){
			this.playerPosInfo[pos] = this.getDataForPlayerInPos(pos);
		}
	}

	getDataForPlayerInPos(playerPos){
		let data = {};
		if (playerPos == 10){
			data["name"] = this.game_data.pair_1_names[0] ? this.game_data.pair_1_names[0] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_1[0]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_1[0]);
		}
        else if (playerPos == 20){
			data["name"] = this.game_data.pair_2_names[0] ? this.game_data.pair_2_names[0] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_2[0]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_2[0]);
		}
        else if (playerPos == 11){
			data["name"] = this.game_data.pair_1_names[1] ? this.game_data.pair_1_names[1] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_1[1]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_1[1]);
		}
        else if (playerPos == 21){
			data["name"] = this.game_data.pair_2_names[1] ? this.game_data.pair_2_names[1] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_2[1]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_2[1]);
		}
		return data;
	}

	canShowPlayerBid(playerName){
		if (this.playerBids.hasOwnProperty(playerName))
			return this.playerBids[playerName].showPlayerBid;
		return false;
	}

	getPlayerLastBid(playerName){
		if (this.playerBids.hasOwnProperty(playerName))
			return this.playerBids[playerName].playerLastBid;
		return false;
	}

}