import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
	providedIn: 'root'
})
export class HttpDataService {
    constructor(private http: HttpClient){}

    postData(url, data){
        return this.http.post(url, data);
    }

    getData(url){
        return this.http.get(url);
    }
}