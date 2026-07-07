import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token JWT' })
  async login(@Body() loginDto: any) {
    // AQUÍ DEBERÍAS VALIDAR EL USUARIO CONTRA LA BASE DE DATOS
    // Por ahora, simularemos que el usuario es válido
    const user = { email: loginDto.email, userId: '123' }; 
    
    if (loginDto.password !== '123456') { // Contraseña simulada
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return this.authService.login(user);
  }
}
