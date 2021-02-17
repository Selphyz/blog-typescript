import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/auth/auth.service';
import { Repository } from 'typeorm';
import { UserEntity } from './models/user.entity';
import { User } from './models/user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private authService: AuthService,
  ) {}
  async create(user: User): Promise<Observable<User>> {
    return (await this.authService.hashPassword(user.password)).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.username = user.username;
        newUser.email = user.email;
        newUser.password = passwordHash;
        return from(this.userRepo.save(newUser)).pipe(
          map((user: User) => {
            const { password, ...result } = user;
            return result;
          }),
          catchError((err) => throwError(err)),
        );
      }),
    );
  }
  findOne(id: number): Observable<User> {
    return from(this.userRepo.findOne({ id })).pipe(
      map((user: User) => {
        const { password, ...result } = user;
        return result;
      }),
    );
  }
  findAll(): Observable<User[]> {
    return from(this.userRepo.find()).pipe(
      map((users: User[]) => {
        users.forEach((user) => {
          delete user.password;
        });
        return users;
      }),
    );
  }
  updateOne(id: number, user: User): Observable<any> {
    delete user.email;
    delete user.password;
    return from(this.userRepo.update(id, user));
  }
  delete(id: number): Observable<any> {
    return from(this.userRepo.delete(id));
  }
  login(user: User): Observable<string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: User) => {
        if (user) {
          return this.authService
            .generateJWT(user)
            .pipe(map((jwt: string) => jwt));
        } else {
          return 'Wrong credentials';
        }
      }),
    );
  }
  validateUser(email: string, password: string): Observable<User> {
    return this.findByMail(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePassword(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              const { password, ...result } = user;
              return result;
            } else {
              throw Error;
            }
          }),
        ),
      ),
    );
  }
  findByMail(email: string): Observable<User> {
    return from(this.userRepo.findOne({ email }));
  }
}
