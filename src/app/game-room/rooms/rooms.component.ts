import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketClientService } from '../../services/socket-client.service';
import { PlayerDataService } from '../../services/player-data.service';
import { HttpDataService } from "../../services/http-data.service";
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
	selector: 'app-roooms',
	templateUrl: './rooms.component.html',
	styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit, OnDestroy {
	roomName: string;
	partOfRoom: boolean = false;
	availableRooms: string[] = [];
	playersInRoom: string[];
	subscription: Subscription;
	playerId: string;
	playerName: string;
	private apiUrl: string = environment.apiUrl;

	constructor(
		private playerDataService: PlayerDataService,
		private messageClient: SocketClientService,
		private router: Router,
		private http: HttpDataService) { }

	ngOnInit() {
		this.messageClient.roomEvents.subscribe(data => {
			if (data.msgType == "players_in_room") {
				this.playersInRoom = data.data;
				this.partOfRoom = true;
			}
			else if (data.msgType == "room_created") {
				if (!this.availableRooms.includes(data.data))
					this.availableRooms.push(data.data);
			}
			else if (data.msgType == "join_room_failed") {
				alert(data.data);
				this.partOfRoom = false;
			}
		});

		this.messageClient.gameEvents.subscribe(data => {
			if (data.msgType == "game_start")
				this.router.navigate(['game-table']);
		});

		this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
			this.playerId = data.playerId;
			this.playerName = data.playerName;
		});

		this.http.getData(`${this.apiUrl}/getActiveRooms`).subscribe((data: any) => {
			if (data.rooms_available)
				this.availableRooms = data.rooms_available;
		});
	}

	joinRoom(room) {
		this.messageClient.joinRoom(room.roomId, this.playerId);
		this.roomName = room.roomName;
	}

	createRoom() {
		this.messageClient.createRoom(this.roomName, this.playerId);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}
}
