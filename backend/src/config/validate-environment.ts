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

  return { ...config, PORT: port, CORS_ORIGIN: origin, DATABASE_URL: databaseUrl };
}
