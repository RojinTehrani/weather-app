// services/weather.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  admin1_id: number;
  timezone: string;
  population: number;
  country_id: number;
  country: string;
  admin1: string;
}

export interface SearchResponse {
  results: City[];
  generationtime_ms: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);
  private baseUrl = 'https://weathergeo.arusha.dev/v1/';

  searchCity(name: string, count: number = 5, language: string = 'fa'): Observable<SearchResponse> {
    const params = {
      name: name,
      count: count.toString(),
      language: language,
      format: 'json'
    };

    return this.http.get<SearchResponse>(this.baseUrl + 'search', { params });
  }
  // detect language
  smartSearch(name: string, count: number = 5): Observable<SearchResponse> {
    const isPersian = /[\u0600-\u06FF]/.test(name);
    const language = isPersian ? 'fa' : 'en';

    return this.searchCity(name, count, language);
  }

  findWeather(latitude: number, longitude: number): Observable<any> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
      timezone: 'auto'
    };
    return this.http.get<any>('https://weather.arusha.dev/v1/forecast', { params });
  }

  findDailyForecast(latitude: number, longitude: number, days: number = 7): Observable<any> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      forecast_days: days.toString(),
      timezone: 'auto'
    };

    return this.http.get<any>('https://weather.arusha.dev/v1/forecast', { params });
  }

  findHourlyForecast(latitude: number, longitude: number): Observable<any> {
  const params = {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: 'temperature_2m',
    forecast_days: '1',
    timezone: 'auto'
  };
  return this.http.get<any>('https://weather.arusha.dev/v1/forecast', { params });
}
}