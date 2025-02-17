import { plainToClass } from 'class-transformer';
import { IsOptional, IsPort, IsString, validateSync } from 'class-validator';

export class Environment {
  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsString()
  USERS_ACCESS_TOKEN_SECRET: string;
}

export const validateEnv = (env: NodeJS.ProcessEnv) => {
  const validatedEnv = plainToClass(Environment, env);

  if (env.SKIP_ENV_VALIDATION) {
    return validatedEnv;
  }

  const validationErrors = validateSync(validatedEnv, {
    skipMissingProperties: false,
  });

  if (validationErrors.length > 0) {
    throw new Error(
      `Environment validation error: ${validationErrors.join(', ')}`,
    );
  }

  return validatedEnv;
};
