const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Pretty-print locally for readability; emit raw JSON in production so
  // log aggregators (Railway/Render/Datadog/CloudWatch etc.) can parse it.
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});

module.exports = logger;
