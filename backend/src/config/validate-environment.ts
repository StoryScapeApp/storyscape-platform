type Environment = Record<string, unknown>;

export function validateEnvironment(config: Environment): Environment {
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const origin = String(config.CORS_ORIGIN ?? 'http://localhost:5173');
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error();
    }
  } catch {
    throw new Error('CORS_ORIGIN must be a single HTTP(S) origin');
  }

  const databaseUrl = String(config.DATABASE_URL ?? '');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }

  const jwtSecret = String(config.JWT_SECRET ?? '');
  if (Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }

  const jwtExpiresIn = Number(config.JWT_EXPIRES_IN ?? 3600);
  if (!Number.isInteger(jwtExpiresIn) || jwtExpiresIn < 1) {
    throw new Error('JWT_EXPIRES_IN must be a positive number of seconds');
  }

  const cookieSecure = config.COOKIE_SECURE ?? (config.NODE_ENV === 'production' ? 'true' : 'false');
  if (cookieSecure !== 'true' && cookieSecure !== 'false') {
    throw new Error('COOKIE_SECURE must be true or false');
  }

  const cookieSameSite = String(config.COOKIE_SAME_SITE ?? 'lax');
  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
  }
  if (cookieSameSite === 'none' && cookieSecure !== 'true') {
    throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }
  if (config.NODE_ENV === 'production' && cookieSecure !== 'true') {
    throw new Error('COOKIE_SECURE must be true in production');
  }

  return {
    ...config,
    PORT: port,
    CORS_ORIGIN: origin,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    COOKIE_SECURE: cookieSecure === 'true',
    COOKIE_SAME_SITE: cookieSameSite,
  };
}
