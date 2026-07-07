import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // 🔄 Importación limpia y oficial
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) // 🔄 Usamos el nombre estándar sin alias
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: any): Promise<User> {
    // 🔑 Generamos el Salt (factor de costo 10 es el estándar balanceado)
    const salt = await bcrypt.genSalt(10);
    
    // 🔑 Reemplazamos la contraseña cruda por su versión haseada irreversible
    userData.password = await bcrypt.hash(userData.password, salt);

    const newUser = this.usersRepository.create(userData as User); // 🔄 Casteamos a User aquí
    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    // 🔄 Cambiado .findAll() por .find() que es el método real de TypeORM
    return this.usersRepository.find(); 
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }
}