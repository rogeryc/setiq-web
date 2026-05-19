import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-overview-page',
  imports: [RouterLink],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.css',
  // Class names live in the global setiq.css and need to apply without
  // attribute-rewriting; turn off encapsulation for this component.
  encapsulation: ViewEncapsulation.None,
})
export class OverviewPage {}
