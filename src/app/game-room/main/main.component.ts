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


	constructor(
		private playerDataService: PlayerDataService,
		private messageClient: SocketClientService,
		private gameDataService: GameDataService,
		private router: Router) { }

	ngOnInit() {
		this.bid_number = 15;
		
		this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
			this.my_player_id = data.playerId;
		});

		this.gameDataService.getGameData().subscribe((game_data: GameData) => {
			this.game_data = game_data;
			this.updatePlayerPosInfo();
		});

		this.messageClient.gameEvents.subscribe(data => this.handleGameEvents(data));
	}

	handleGameEvents(data){
		if (data.msgType == "player_card"){
			let validCard = false;
			if (data.data.forPlayer == this.my_player_id){
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
			if (data.data.bidding_player == this.my_player_id){
				this.showTrumpModal();
			}
		}
		else if(data.msgType == "room_invalid"){
			this.router.navigate(['/main']);
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

	selectTrump(selectedTrump){
		this.messageClient.setTrump(selectedTrump);
		this.closeModal.nativeElement.click();
	}

}