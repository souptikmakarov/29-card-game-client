import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerDataService {
  playerInfo = new BehaviorSubject<PlayerInfo>(new PlayerInfo(null, null));

  setPlayerInfo(info: PlayerInfo){
    this.playerInfo.next(info);
  }

  getPlayerInfo(): Observable<PlayerInfo>{
    return this.playerInfo.asObservable();
  }
}

export class PlayerInfo{
  constructor(name, id){
    this.playerId = id;
    this.playerName = name;
  }
  playerName: string;
  playerId: string;
}