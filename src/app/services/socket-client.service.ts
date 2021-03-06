import { Injectable, EventEmitter } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { PlayerDataService, PlayerInfo } from './player-data.service';
import { GameDataService, GameData, Card } from './game-data.service';

@Injectable({
	providedIn: 'root'
})
export class SocketClientService {

	gameEvents = new EventEmitter<any>();

	roomEvents = new EventEmitter<any>();

	constructor(private socket: Socket, private playerService: PlayerDataService, private gameDataService: GameDataService) {

		this.socket.on('connect', () => {
			playerService.getPlayerInfo().subscribe((data: PlayerInfo) =>{
				if (data.playerId)
					gameDataService.getGameData().subscribe((gameData: GameData) => {
						if(data.playerId && gameData.roomId)
							socket.emit("player_reconnect", {
								playerId: data.playerId,
								roomId: gameData.roomId
							});
					});
				
			});
		});

		this.socket.fromEvent("room_invalid").subscribe(data => {
			this.roomEvents.emit({
				msgType: "room_invalid",
				data: data
			});
		});

		this.socket.fromEvent("players_in_room").subscribe(data => {
			this.roomEvents.emit({
				msgType: "players_in_room",
				data: data
			});
		});

		this.socket.fromEvent("room_created").subscribe(data => {
			this.roomEvents.emit({
				msgType: "room_created",
				data: data
			});
		});

		this.socket.fromEvent("join_room_failed").subscribe(data => {
			this.roomEvents.emit({
				msgType: "join_room_failed",
				data: data
			});
		});

		this.socket.fromEvent("rooms_available").subscribe(data => {
			this.roomEvents.emit({
				msgType: "rooms_available",
				data: data
			});
		});

		this.socket.fromEvent("game_start").subscribe(() => {
			this.gameEvents.emit({
				msgType: "game_start"
			});
		});

		this.socket.fromEvent("player_card").subscribe(data => {
			this.gameEvents.emit({
				msgType: "player_card",
				data: data
			});
		});

		this.socket.fromEvent("bidding_raise").subscribe(data => {
			this.gameEvents.emit({
				msgType: "bidding_raise",
				data: data
			});
		});

		this.socket.fromEvent("bidding_update").subscribe(data => {
			this.gameEvents.emit({
				msgType: "bidding_update",
				data: data
			});
		});

		this.socket.fromEvent("bidding_complete").subscribe(data => {
			this.gameEvents.emit({
				msgType: "bidding_complete",
				data: data
			});
		});

		this.socket.fromEvent("play_card").subscribe(forPlayer => {
			this.gameEvents.emit({
				msgType: "play_card",
				forPlayer: forPlayer
			});
		});

		this.socket.fromEvent("player_dealt_card").subscribe(data => {
			this.gameEvents.emit({
				msgType: "player_dealt_card",
				data: data
			});
		});

		this.socket.fromEvent("trump_revealed").subscribe(trump => {
			this.gameEvents.emit({
				msgType: "trump_revealed",
				trump: trump
			});
		});

		this.socket.fromEvent("hand_complete").subscribe(data => {
			this.gameEvents.emit({
				msgType: "hand_complete",
				data: data
			});
		});

		this.socket.fromEvent("game_complete").subscribe(data => {
			this.gameEvents.emit({
				msgType: "game_complete",
				data: data
			});
		});
		
	}

	createRoom(roomName: string, playerId: string){
		this.socket.emit("create_room", { roomName, playerId });
	}

	joinRoom(roomId: string, playerId: string){
		this.socket.emit("join_room", { roomId, playerId });
	}

	makeBid(bid: number, roomId: string){
		this.socket.emit("player_bid", { bid, roomId });
	}

	setTrump(trump: string, roomId: string){
		this.socket.emit("set_trump", { trump, roomId });
	}

	dealCard(card: Card, playerId: string, roomId: string){
		this.socket.emit("deal_card", { 
			card, playerId, roomId
		});
	}

	showTrump(roomId: string) {
		this.socket.emit("show_trump", roomId);
	}

	sendMessage(body, subject){
		this.socket.emit(body, subject);
	}
}