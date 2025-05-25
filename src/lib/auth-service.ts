// Empty auth service placeholder
import { User, UserRole } from '../types/users';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getCurrentUser(): User | null {
    return null;
  }

  setCurrentUser(user: User | null) {}

  async login(email: string, password: string): Promise<boolean> {
    return false;
  }

  async logout(): Promise<void> {}

  async signUp(email: string, password: string, userData: any): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Auth functionality removed' };
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Auth functionality removed' };
  }

  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Auth functionality removed' };
  }

  isAuthenticated(): boolean {
    return false;
  }

  hasPermission(permission: string): boolean {
    return false;
  }

  hasRole(role: UserRole): boolean {
    return false;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return () => {};
  }
}

export const auth = AuthService.getInstance();