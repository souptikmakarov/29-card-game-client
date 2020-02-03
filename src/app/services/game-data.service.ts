import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class GameDataService {

	constructor(private http: HttpClient){}

	gameData = new BehaviorSubject<GameData>(new GameData());
	private apiUrl: string = environment.apiUrl;
  
	setGameData(info: GameData){
	  	this.gameData.next(info);
	}
  
	getGameData(): Observable<GameData>{
	  	return this.gameData.asObservable();
	}

	initGameWithPlayers(playerList: string[]){
		let p_names = [];
		for (var p in playerList){
			this.http.post(`${this.apiUrl}/getPlayerName`, {
				playerId: playerList[p]
			}).subscribe(
				(data: any) => {
					if (!data.err){
						p_names.push(data.name);
					}
					else{
						alert("Login failed. Please try again");
					}
				},
				(error) => { 
					console.log(error);
					alert("Register failed. Please try again");
				}
			);
		}
		let gd = new GameData();
		gd.pair_1 = [p_names[0], p_names[1]];
		gd.pair_2 = [p_names[2], p_names[3]];
		this.setGameData(gd);
	}
}

export class GameData {
	pair_1_score: number = 0;
	pair_2_score: number = 0;
	pair_1: string[] = ["",""];
	pair_2: string[] = ["",""];
	card_in_hand: Card[];
}

export class Card{
	suit: string;
	rank: string;

	constructor(suit, rank){
		this.suit = suit;
		this.rank = rank;
	}

	getImage(){
		let fileName = `${this.rank}${this.suit}.jpg`;
		return `../../../assets/card-images/${fileName}`;
	}
}