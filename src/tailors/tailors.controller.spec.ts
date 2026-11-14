import { describe, it, expect } from 'vitest';
import { TailorsController } from './tailors.controller';
import { TailorsService } from './tailors.service';

describe('TailorsController', () => {
  let controller: TailorsController;

  it('should be defined', () => {
    controller = new TailorsController({} as TailorsService);

    expect(controller).toBeDefined();
  });
});