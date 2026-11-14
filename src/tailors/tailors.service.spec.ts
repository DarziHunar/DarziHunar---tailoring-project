import { describe, it, expect } from 'vitest';
import { TailorsService } from './tailors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TailorsService', () => {
  let service: TailorsService;

  it('should be defined', () => {
    service = new TailorsService({} as PrismaService);

    expect(service).toBeDefined();
  });
});