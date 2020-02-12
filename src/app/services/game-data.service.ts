import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { take } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class GameDataService {

	constructor(private http: HttpClient){}

	gameData = new BehaviorSubject<GameData>(new GameData());
	private apiUrl: string = environment.apiUrl;
	private p_names: string[] = [];
	private p_list: string[];
  
	setGameData(info: GameData){
	  	this.gameData.next(info);
	}
  
	getGameData(): Observable<GameData>{
	  	return this.gameData.asObservable();
	}

	initGameWithPlayers(playerList: string[], roomId: string, callback: Function){
		let gd = new GameData();
		gd.roomId = roomId;
		gd.pair_1 = [playerList[0], playerList[1]];
		gd.pair_2 = [playerList[2], playerList[3]];
		this.setGameData(gd);

		this.p_list = playerList;
		this.getAndPopulatePlayerNames(this.p_list.shift());
		callback();
	}

	getAndPopulatePlayerNames(player: string){
		this.http.post(`${this.apiUrl}/getPlayerName`, {
			playerId: player
		}).subscribe(
			(data: any) => {
				if (!data.err){
					this.p_names.push(data.name);
					if (this.p_list.length)
						this.getAndPopulatePlayerNames(this.p_list.shift());
					else{
						this.getGameData().pipe(take(1)).subscribe((data: GameData) => {
							data.pair_1_names = [this.p_names[0], this.p_names[1]];
							data.pair_2_names = [this.p_names[2], this.p_names[3]];
							this.setGameData(data);
						});
					}
				}
				else{
					alert("Player not found. Please try again");
				}
			},
			(error) => { 
				console.log(error);
				alert("Player fetch failed.");
			}
		);
	}
}

export class GameData {
	roomId: string = "";
	pair_1_score: number = 0;
	pair_2_score: number = 0;
	pair_1: string[] = ["",""];
	pair_2: string[] = ["",""];
	pair_1_names: string[] = ["",""];
	pair_2_names: string[] = ["",""];
	card_in_hand: Card[] = [];
	set_seventh_trump: boolean = false;
}

export class Card{
	suit: string;
	rank: string;
	isShown: boolean;
	dealt: boolean;

	constructor(suit, rank, isShown=true){
		this.suit = suit;
		this.rank = rank;
		this.isShown = isShown;
		this.dealt = false;
	}

	getImage(){
		let fileName = "";
		if (this.isShown)
			fileName = `${this.rank}${this.suit}.jpg`;
		else if (this.dealt)
			fileName = "blank.jpg";
		else
			fileName = "card_back.jpg";
		return `../../../assets/card-images/${fileName}`;
	}

	static getSpecialImage(suit: string){
		let fileName = `${suit}.jpg`;
		return `../../../assets/card-images/${fileName}`;
	}
}