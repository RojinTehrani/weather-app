import { AfterViewInit, Component, OnInit, computed, inject, signal } from '@angular/core'
import { WeatherService } from '../../services/weather.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';
import { NavComponent } from "../../../../shared/header/nav/nav.component";
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule, NavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private hourlyChart: any;
  hourlyTimes: string[] = [];
  hourlyTemperatures: number[] = [];
  hourlyChartLoaded: boolean = false;


  feelsLike: any = null;
  tempMin: any = null;
  tempMax: any = null;

  currentDate: any;
  currentDay: any;

  currentDateGregorian: any;
  currentDayGregorian: any;

  selectedCountry: string = '';
  selectedCity: string = '';
  latitude: number = 0;
  longitude: number = 0;

  humidity: any = null;
  windSpeed: any = null;

  searchTerm = '';
  results: any[] = [];
  isLoading = false;
  isSearching = false;
  weatherInfo: any;

  weatherLoading: boolean = true;
  currentTime: string = '';
  isDay = 0
  searchFocused = false
  dailyForecast: any = null;
  forecastDays: any[] = [];
  
  private weatherCode = signal<number | null>(null);

  weatherCondition = computed(() => {
    const code = this.weatherCode();
    if (code === null) return null;
    return this.getWeatherByCode(code).label;
  });

  weatherIcon = computed(() => {
    const code = this.weatherCode();
    if (code === null) return 'clear-sky.png';
    return this.getWeatherByCode(code).icon;
  });

  constructor(private weatherService: WeatherService,
  ) { }

  ngOnInit(): void {
    this.loadLastSelectedCity();
    if (!this.selectedCity) {
      this.setDefaultCity();
    } else {
      this.findWeather();
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.hourlyTemperatures.length > 0) {
        this.initHourlyChart();
      } else if (this.latitude && this.longitude) {
        this.loadHourlyForecast();
      }
    }, 500);
  }

  formatApiTime(timeString: string): string {
    if (!timeString) return '--:--';

    const parts = timeString.split('T');
    if (parts.length < 2) return '--:--';

    const timePart = parts[1];
    return timePart;
  }

  setDefaultCity() {
    this.selectedCity = 'تهران';
    this.selectedCountry = 'ایران';
    this.latitude = 35.6892;
    this.longitude = 51.3890;
    this.findWeather();
  }

  onSearchChange() {
    if (this.searchTerm.length > 2) {
      this.isSearching = true;
      this.weatherService.smartSearch(this.searchTerm).subscribe({
        next: (response) => {
          this.results = response.results || [];
          this.isSearching = false;
        },
        error: (error) => {
          this.isSearching = false;
        }
      });
    } else {
      this.results = [];
    }
  }

  selectCity(city: any) {
    this.selectedCity = city.name;
    this.selectedCountry = city.country;
    this.latitude = city.latitude;
    this.longitude = city.longitude;

    this.searchTerm = '';
    this.results = [];
    this.isSearching = false;
    this.searchFocused = false;
    this.saveLastSelectedCity();
    this.weatherLoading = true;
    this.findWeather();

  }

  findWeather() {
    if (!this.latitude || !this.longitude) {
      this.weatherLoading = false;
      return;
    }

    this.weatherService.findWeather(this.latitude, this.longitude).subscribe({
      next: (val) => {
        // console.log(val);
        this.weatherInfo = val;

        if (val?.current) {
          this.tempMax = Math.round(val.current.temperature_2m);
          this.tempMin = Math.round(val.current.temperature_2m);
          this.humidity = val.current.relative_humidity_2m;
          this.windSpeed = val.current.wind_speed_10m;
          this.feelsLike = Math.round(val.current.apparent_temperature || val.current.temperature_2m);
          this.isDay = val.is_day
          this.weatherCode.set(val.current.weather_code);

          if (val.current.time) {
            this.currentTime = this.formatApiTime(val.current.time);
            this.updateDatesFromApiTime(val.current.time);
            // console.log("gffggf", val.current);

          }
          this.loadDailyForecast();
          this.loadHourlyForecast();

        }
        this.weatherLoading = false;
      },
      error: (error) => {
        if (this.weatherLoading) {
          this.tempMax = 28;
          this.tempMin = 18;
          this.humidity = 45;
          this.windSpeed = 12;
          this.feelsLike = 24;
          this.weatherCode.set(2)
        }
        this.weatherLoading = false;
      }
    });
  }

  getWeatherByCode(code: number): { label: string; icon: string } {
    if (code === 0) return { label: 'آسمان صاف', icon: 'clear-sky.png' };
    if (code === 1) return { label: 'عمدتا آفتابی', icon: 'mostly-sunny.png' };
    if (code === 2) return { label: 'نیمه ابری', icon: 'partly-cloudy.png' };
    if (code === 3) return { label: 'ابری', icon: 'cloudy.png' };
    if (code === 45 || code === 48) return { label: 'مه آلود', icon: 'fog.png' };
    if (code === 51 || code === 53 || code === 55) return { label: 'نم‌نم باران', icon: 'drizzle.png' };
    if (code >= 61 && code <= 65) return { label: 'بارانی', icon: 'rain.png' };
    if (code >= 71 && code <= 77) return { label: 'برفی', icon: 'snow.png' };
    if (code === 80 || code === 81 || code === 82) return { label: 'رگبار', icon: 'shower.png' };
    if (code === 95) return { label: 'طوفان رعدوبرق', icon: 'thunderstorm.png' };
    if (code === 96 || code === 99) return { label: 'طوفان با تگرگ', icon: 'hailstorm.png' };
    return { label: 'متغیر', icon: 'variable.png' };
  }

  selectCityFromList(cityName: string, countryName: string, lat: number, lon: number) {
    this.selectedCity = cityName;
    this.selectedCountry = countryName;
    this.latitude = lat;
    this.longitude = lon;
    this.searchTerm = cityName;
    this.saveLastSelectedCity();
    this.weatherLoading = true;
    this.findWeather();
    this.searchTerm = '';
  }
  updateDatesFromApiTime(timeString: string) {
    if (!timeString) return;

    const datePart = timeString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    const gregorianDate = new Date(year, month - 1, day);

    const persianDate = new Date(gregorianDate);

    this.currentDay = persianDate.toLocaleDateString('fa-IR', { weekday: 'long' });

    this.currentDate = persianDate.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.currentDayGregorian = gregorianDate.toLocaleDateString('en-US', { weekday: 'long' });

    this.currentDateGregorian = gregorianDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  loadDailyForecast() {
    this.weatherService.findDailyForecast(this.latitude, this.longitude, 5).subscribe({
      next: (data) => {
        if (data?.daily) {
          this.forecastDays = data.daily.time.map((time: string, index: number) => ({
            date: time,
            maxTemp: Math.round(data.daily.temperature_2m_max[index]),
            minTemp: Math.round(data.daily.temperature_2m_min[index]),
            weatherCode: data.daily.weather_code[index],
          }));
        }
      },
      error: (error) => {
      }
    });
  }

  initHourlyChart() {
    if (typeof Highcharts === 'undefined') {
      return;
    }

    const options: any = {
      chart: {
        type: 'spline',
        backgroundColor: 'transparent',
        animation: { duration: 1000 },
        zoomType: 'x'
      },
      title: { text: undefined },
      xAxis: {
        categories: this.hourlyTimes,
        title: { text: 'ساعت', style: { color: '#666' } },
        labels: { rotation: -45, style: { fontSize: '10px' } },
      },
      yAxis: {
        title: { text: 'دما (°C)', style: { color: '#666' } },
        labels: { format: '{value}°' }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#75abf8',
        borderRadius: 8,
        useHTML: true,
        style: { color: '#fff', fontSize: '12px' },
        formatter: function (this: any) {
          return `<div style="text-align:center;">
          <strong>⏰ ${this.x}</strong><br/>
          <span style="font-size:15px;">🌡️ ${this.y}°C</span>
        </div>`;
        }
      },
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        spline: {
          lineWidth: 3,
          color: '#0088ff',
          marker: {
            enabled: true,
            radius: 4,
            fillColor: '#1eaffe',
            lineWidth: 2,
            lineColor: '#1eaffe'
          }
        }
      },
      series: [{
        name: 'دما',
        type: 'spline',
        data: this.hourlyTemperatures,
        color: '#1eaffe'
      }]
    };

    const chartElement = document.getElementById('hourly-temp-chart');
    if (chartElement) {
      this.hourlyChart = Highcharts.chart('hourly-temp-chart', options);
      this.hourlyChartLoaded = true;
    }
  }

  updateHourlyChart(times: string[], temperatures: number[]) {
    if (this.hourlyChart) {
      this.hourlyChart.xAxis[0].setCategories(times);
      this.hourlyChart.series[0].setData(temperatures, true, true, false);
    } else {
      this.hourlyTimes = times;
      this.hourlyTemperatures = temperatures;
      this.initHourlyChart();
    }
  }

  loadHourlyForecast() {
    if (!this.latitude || !this.longitude) return;

    this.weatherService.findHourlyForecast(this.latitude, this.longitude).subscribe({
      next: (data) => {
        if (data?.hourly) {
          this.hourlyTimes = data.hourly.time.map((t: string) => {
            const timePart = t.split('T')[1];
            return timePart ? timePart.slice(0, 5) : t;
          });

          this.hourlyTemperatures = data.hourly.temperature_2m.map((temp: number) => {
            return Math.round(temp);
          });

          this.updateHourlyChart(this.hourlyTimes, this.hourlyTemperatures);
        }
      },
      error: (error) => {
      }
    });
  }



  getDayName(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
    return days[date.getDay()];
  }

  saveLastSelectedCity() {
    const lastCity = {
      name: this.selectedCity,
      country: this.selectedCountry,
      latitude: this.latitude,
      longitude: this.longitude
    };
    localStorage.setItem('lastSelectedCity', JSON.stringify(lastCity));
  }

  loadLastSelectedCity() {
    const savedCity = localStorage.getItem('lastSelectedCity');
    if (savedCity) {
      try {
        const city = JSON.parse(savedCity);
        this.selectedCity = city.name;
        this.selectedCountry = city.country;
        this.latitude = city.latitude;
        this.longitude = city.longitude;
      } catch (error) {
        // console.error(error);
      }
    }
  }

}