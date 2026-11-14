import { describe, it, expect } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  it('should be defined', () => {
    controller = new AuthController({} as AuthService);

    expect(controller).toBeDefined();
  });
});