import { Controller, Get, Query } from '@nestjs/common';
import { StylesService } from './styles.service';

@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Get()
  findAll(@Query('audience') audience?: string) {
    return this.stylesService.findAll(audience);
  }
}
