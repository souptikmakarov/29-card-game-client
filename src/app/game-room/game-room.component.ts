import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlayerDataService, PlayerInfo } from "../services/player-data.service";
import { SocketClientService } from '../services/socket-client.service';
import { Router } from '@angular/router';
import { Subscription } from "rxjs";

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css']
})
export class GameRoomComponent implements OnInit, OnDestroy {

  subscription: Subscription;
  player_name: string;
  constructor(private playerDataService: PlayerDataService, private router: Router) { }

  ngOnInit() {
    this.subscription = this.playerDataService.getPlayerInfo().subscribe(data => {
      if (data.playerId && data.playerName)
        this.player_name = data.playerName;
      else 
        this.router.navigate(['/login']);
    });
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

}
