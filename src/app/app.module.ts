import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from './app.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { RoomsComponent } from './game-room/rooms/rooms.component';
import { MainComponent } from './game-room/main/main.component';
import { LoginComponent } from './login/login.component';
import { GameRoomComponent } from './game-room/game-room.component';
import { environment } from "../environments/environment";
import { LongPress } from './long-press';

const config: SocketIoConfig = { url: environment.apiUrl, options: {} };

const appRoutes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'main', 
    component: GameRoomComponent, 
    children: [
      {
        path: '',
        component: RoomsComponent
      },
      {
        path: 'rooms',
        component: RoomsComponent
      },
      {
        path: 'game-table',
        component: MainComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    AppComponent,
    RoomsComponent,
    MainComponent,
    LoginComponent,
    GameRoomComponent,
    LongPress
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SocketIoModule.forRoot(config),
    HttpClientModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
