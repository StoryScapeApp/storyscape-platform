import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsDefined()
  @IsEmail()
  email!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
