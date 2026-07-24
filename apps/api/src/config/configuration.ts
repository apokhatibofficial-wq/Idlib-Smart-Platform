import { validateEnv } from './env.validation';

export function configuration() {
  const env = validateEnv(process.env);

  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    appUrl: env.APP_URL,
    webUrl: env.WEB_URL,
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),

    database: { url: env.DATABASE_URL },
    redis: { url: env.REDIS_URL },

    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    cookie: {
      secret: env.COOKIE_SECRET,
      domain: env.COOKIE_DOMAIN || undefined,
    },

    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
      enabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },

    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      fromName: env.SMTP_FROM_NAME,
      fromEmail: env.SMTP_FROM_EMAIL,
      configured: Boolean(env.SMTP_USER && env.SMTP_PASSWORD),
    },

    otp: {
      length: env.OTP_LENGTH,
      ttlSeconds: env.OTP_TTL_SECONDS,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
      resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
    },

    throttle: {
      ttlSeconds: env.THROTTLE_TTL_SECONDS,
      limit: env.THROTTLE_LIMIT,
    },

    vapid: {
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
      subject: env.VAPID_SUBJECT,
      configured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    },

    emergencyNumber: env.EMERGENCY_NUMBER,

    upload: {
      dir: env.UPLOAD_DIR,
      maxFileSizeMb: env.UPLOAD_MAX_FILE_SIZE_MB,
    },

    fieldEncryptionKey: env.FIELD_ENCRYPTION_KEY,
    businessAccountFeeUsd: env.BUSINESS_ACCOUNT_FEE_USD,
    logLevel: env.LOG_LEVEL,
  };
}

export type AppConfig = ReturnType<typeof configuration>;
