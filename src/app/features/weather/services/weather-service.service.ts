import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherServiceService {
  private http = inject(HttpClient)
  constructor() { }
  searchCity(cityName: string): Observable<any> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=5&format=json`;
    return this.http.get(url);
  }
}
