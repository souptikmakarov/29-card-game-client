import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlayerDataService, PlayerInfo } from "../services/player-data.service";
import { HttpDataService } from "../services/http-data.service";
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Subscription } from "rxjs";

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
	username: string;
	password: string;
	subscription: Subscription;
	private apiUrl: string = environment.apiUrl;
	constructor(private playerDataService: PlayerDataService, private http: HttpDataService, private router: Router) { }

	ngOnInit() {
		this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
			if (data.playerId && data.playerName){
				this.router.navigate(['/main']);
			}
		});
	}

	loginUser() {
		this.http.postData(`${this.apiUrl}/login`, {
			name: this.username,
			password: this.password
		}).subscribe(
			(data: any) => {
				if (!data.err){
					this.playerDataService.setPlayerInfo(new PlayerInfo(this.username, data.playerId));
					// this.router.navigate(['/main']);
				}
				else{
					alert("Login failed. Please try again");
				}
			},
			(error) => { 
				console.log(error);
				alert("Login failed. Please try again");
			}
		);
	}

	registerUser() {
		if (this.username.length <= 10)
			this.http.postData(`${this.apiUrl}/register`, {
				name: this.username,
				password: this.password
			}).subscribe(
				(data: any) => {
					if (!data.err){
						this.playerDataService.setPlayerInfo(new PlayerInfo(this.username, data.playerId));
						this.router.navigate(['/main']);
					}
					else{
						alert("Register failed. Please try again");
					}
				},
				(error) => { 
					console.log(error); 
					alert("Register failed. Please try again");
				}
			);
		else
			alert("Please enter a name <= 10 characters");
	}

	ngOnDestroy(){
		this.subscription.unsubscribe();
	}

}
