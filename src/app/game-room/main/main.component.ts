import { Component, OnInit } from '@angular/core';
import { SocketClientService } from 'src/app/services/socket-client.service';
import { PlayerDataService } from 'src/app/services/player-data.service';
import { GameDataService, GameData, Card } from 'src/app/services/game-data.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

	bid_number: number;
	game_data: GameData;
	my_player_id: string;
	subscription: Subscription;
	amIBidding: boolean = true;
	playerBids = {};

	constructor(
		private playerDataService: PlayerDataService,
		private messageClient: SocketClientService,
		private gameDataService: GameDataService) { }

	ngOnInit() {
		this.bid_number = 16;

		this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
			this.my_player_id = data.playerId;
		});

		this.gameDataService.getGameData().subscribe((game_data: GameData) => {
			this.game_data = game_data;
		});

		setTimeout(() => {
			let cards = [
				new Card("C", "J"),
				new Card("C", "9"),
				new Card("C", "10"),
				new Card("S", "Q"),
			];
			this.game_data = new GameData();
			this.game_data.card_in_hand = cards;
			this.game_data.pair_1 = ["You", "North"];
			this.game_data.pair_2 = ["East", "West"];
			this.playerBids[this.game_data.pair_1[0]] = {
				showPlayerBid: true,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_2[0]] = {
				showPlayerBid: true,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_1[1]] = {
				showPlayerBid: true,
				playerLastBid: 16
			};
			this.playerBids[this.game_data.pair_2[1]] = {
				showPlayerBid: true,
				playerLastBid: 16
			};
		}, 2000);

		this.messageClient.gameEvents.subscribe(data => {
			if (data.msgType == "player_card"){
				if (data.data.forPlayer == this.my_player_id){
					for (var card of data.data.cards){
						console.log(card);
					}
				}
			}
			else if(data.msgType == "bidding_raise"){

			}
		});
	}

	makeBid(){

	}

	passBid(){

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
