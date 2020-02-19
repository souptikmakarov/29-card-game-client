import { Component, OnInit } from '@angular/core';
import { SocketClientService } from '../services/socket-client.service';
import { environment } from 'src/environments/environment';
import { HttpDataService } from "../services/http-data.service";

@Component({
	selector: 'app-admin',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
	private apiUrl: string = environment.apiUrl;
	availableRooms: string[] = [];
	playersInRoom: string[] = [];
	messageSubject: string;
	messageBody: string;

	constructor(private messageClient: SocketClientService, private http: HttpDataService) { }

	ngOnInit() {
		this.getActiveRooms();
	}

	getPlayersInRoom(room){
		this.http.postData(`${this.apiUrl}/getPlayersInRoom`, {
			roomId: room.roomId
		}).subscribe(
			(data: any) => {
				this.playersInRoom = data.playersInRoom;
			},
			(error) => { 
				console.log(error);
				alert("Player fetch failed.");
			}
		);
	}

	getActiveRooms() {
		this.http.getData(`${this.apiUrl}/getActiveRooms`).subscribe((data: any) => {
			if (data.rooms_available)
				this.availableRooms = data.rooms_available;
		});
	}

	sendMessage(){
		if(this.messageSubject && this.messageBody){
			console.log(JSON.parse(this.messageBody));
			this.messageClient.sendMessage(this.messageSubject, JSON.parse(this.messageBody));
		}
	}
}
