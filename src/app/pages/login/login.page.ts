import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/api/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly rememberMe = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.login(this.email().trim(), this.password(), this.rememberMe());
      this.router.navigateByUrl('/');
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      this.error.set(
        status === 401 ? 'Credenciales inválidas.' : 'No pudimos iniciar sesión. Reintentá.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
