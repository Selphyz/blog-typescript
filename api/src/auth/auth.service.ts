import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable, of } from 'rxjs';
import { User } from 'src/user/models/user.interface';
// import { hash, verify } from 'argon2';
const argon2 = require('argon2');

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  generateJWT(user: User): Observable<string> {
    return from(this.jwtService.signAsync({ user }));
  }
  hashPassword(password: string): Observable<string> {
    return from<string>(argon2.hash(password));
  }
  comparePassword(
    passwordHash: string,
    password: string,
  ): Observable<any | boolean> {
    return from<any | boolean>(argon2.verify(password, passwordHash));
  }
}
