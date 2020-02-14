import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketClientService } from 'src/app/services/socket-client.service';
import { PlayerDataService } from 'src/app/services/player-data.service';
import { GameDataService, GameData, Card } from 'src/app/services/game-data.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
	@ViewChild('openModal', { static: false }) openModal: ElementRef;
	@ViewChild('closeModal', { static: false }) closeModal: ElementRef;
	
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
	my_pair_score: number = 0;
	opp_pair_score: number = 0;
	trump_to_display: string = "card_back";
	my_turn_to_play: boolean = false;
	last_dealt_card: Card;
	curr_hand: Card[];
	isLongPressing: boolean = false;


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
	}

	setupUI(){
		this.bid_number = 15;
		this.trump_choices["card_back"] = Card.getSpecialImage("card_back");
		this.curr_hand = [	new Card("C", "2", false, true), 
							new Card("S", "2", false, true), 
							new Card("D", "2", false, true), 
							new Card("H", "2", false, true), ];
	}

	handleGameEvents(data){
		if (data.msgType == "player_card"){
			if (data.data.forPlayer == this.my_player_id){
				let validCard = false;
				if (this.game_data.card_in_hand.length == 0){
					for (var card of data.data.cards){
						console.log(card);
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
						console.log(card);
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
			this.my_turn_to_play = (data.forPlayer == this.my_player_id);
		}
		else if(data.msgType == "player_dealt_card"){
			// use data.data.playerId, suit and rank to show card played
			console.log(data.data.playerId, data.data.suit, data.data.rank);
			let dealtCard = new Card(data.data.suit, data.data.rank);
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
	}

	showTrumpModal(){
		this.trump_choices["hearts"] = Card.getSpecialImage("hearts");
		this.trump_choices["diamonds"] = Card.getSpecialImage("diamonds");
		this.trump_choices["clubs"] = Card.getSpecialImage("clubs");
		this.trump_choices["spades"] = Card.getSpecialImage("spades");
		this.trump_choices["seventh"] = Card.getSpecialImage("seventh");
		this.trump_choices["joker"] = Card.getSpecialImage("joker");
		this.trump_choices["guarantee"] = Card.getSpecialImage("guarantee");
		this.openModal.nativeElement.click();
	}

	makeBid(){
		if (this.game_data && Object.keys(this.playerBids).length){
			this.playerBids[this.my_player_id].showPlayerBid = true;
			this.playerBids[this.my_player_id].playerLastBid = this.bid_number;
			this.messageClient.makeBid(this.bid_number, this.game_data.roomId);
			this.amIBidding = false;
		}
	}

	passBid(){
		if (this.game_data && Object.keys(this.playerBids).length){
			this.playerBids[this.my_player_id].showPlayerBid = true;
			this.playerBids[this.my_player_id].playerLastBid = "Pass";
			this.messageClient.makeBid(0, this.game_data.roomId);
			this.amIBidding = false;
		}
	}

	selectTrump(selectedTrump){
		this.game_data.set_seventh_trump = (selectedTrump == "seventh");
		this.messageClient.setTrump(selectedTrump, this.game_data.roomId);
		this.gameDataService.setGameData(this.game_data);
		this.closeModal.nativeElement.click();
	}

	onLongPressing(card: Card){
		if (!card.isShown){
			card.isShown = true;
			this.isLongPressing = true;
		}
	}

	onLongPressEnd(card: Card){
		if(this.isLongPressing){
			card.isShown = false;
			this.isLongPressing = false;
		}
	}

	playCard(card: Card, index: number){
		if (this.my_turn_to_play){
			if (card.isShown){
				this.messageClient.dealCard(card, this.my_player_id, this.game_data.roomId);
				card.isDealt = true;
				this.game_data.card_in_hand.splice(index, 1, card);
				this.last_dealt_card = card;
			}
			else{
				alert("Can't play 7th card until trump is revealed");
			}
		}
			
	}

	// nameToDisplay(playerName, playerId) {
	// 	if (!playerId)
	// 		return "Loading...";
	// 	else
	// 		playerId == this.my_player_id ? "You" : playerName;
	// }

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
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_1[0]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_1[0]);
		}
        else if (playerPos == 11){
			data["name"] = this.game_data.pair_1_names[1] ? this.game_data.pair_1_names[1] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_1[0]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_1[0]);
		}
        else if (playerPos == 21){
			data["name"] = this.game_data.pair_2_names[1] ? this.game_data.pair_2_names[1] : "Loading...";
			data["canShowPlayerBid"] = this.canShowPlayerBid(this.game_data.pair_1[0]);
			data["playerLastBid"] = this.getPlayerLastBid(this.game_data.pair_1[0]);
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