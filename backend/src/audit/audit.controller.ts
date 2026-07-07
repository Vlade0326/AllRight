import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // <--- Importante
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(AuthGuard('jwt')) // <--- ESTO PROTEGE TODA LA CLASE
  @Post()
  async create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.auditService.findAll();
  }
}