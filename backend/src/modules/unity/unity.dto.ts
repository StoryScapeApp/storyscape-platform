import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUnitySessionDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) bookRefId?: string;
  // Código devuelto por una sesión anterior: si Unity lo envía, se reutiliza el mismo estudiante
  @IsOptional() @IsString() @Matches(/^ALUMNO-[A-Z0-9]{4,8}$/) studentCode?: string;
}

export class AttemptDto {
  @IsIn(['A', 'B', 'C']) letter!: string;
}

export class UnityQuestionDto {
  @IsString() @MinLength(1) @MaxLength(100) chapterRefId!: string;
  @IsInt() @Min(1) @Max(20) questionNumber!: number;
  @IsIn(['literal', 'inferencial']) questionType!: string;
  @IsString() @MinLength(1) @MaxLength(2000) questionText!: string;
  @IsArray() @ArrayMinSize(3) @ArrayMaxSize(3) @IsString({ each: true }) @MaxLength(500, { each: true }) options!: string[];
  @IsIn(['A', 'B', 'C']) correctLetter!: string;
  @IsArray() @ArrayMaxSize(2) @ValidateNested({ each: true }) @Type(() => AttemptDto) attempts!: AttemptDto[];
}
