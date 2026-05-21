import { Component } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {

  constructor(
    private themeService: ThemeService
  ) { }


  get isDarkMode() {
    return this.themeService.isDarkMode();
  }
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
