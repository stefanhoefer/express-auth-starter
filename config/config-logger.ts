import pino from 'pino';
import pinoHttp from 'pino-http';

const pinoPrettyOptions = {
  colorize: true,
  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l o',
  ignore: 'pid,hostname',
};

const transport = pino.transport({
  targets: [
    {
      level: 'info',
      target: 'pino-pretty',
      options: { ...pinoPrettyOptions },
    },
    {
      level: 'info',
      target: 'pino/file',
      options: { destination: './logs/raw.log' },
    },
    {
      level: 'info',
      target: 'pino-pretty',
      options: { ...pinoPrettyOptions, destination: './logs/formatted.log' },
    },
  ],
});

export const logger = pino(transport);

// export const httpLogger = pinoHttp({ logger: logger, autoLogging: false });
export const httpLogger = pinoHttp({
  logger: pino({
    quietReqLogger: true, // turn off the default logging output
    transport: {
      targets: [
        {
          level: 'warn',
          target: 'pino-pretty',
          options: { ...pinoPrettyOptions },
        },
        {
          level: 'info',
          target: 'pino-pretty', // use the pino-http-print transport and its formatting output
          options: {
            destination: './logs/http.log',
            all: true,
          },
        },
      ],
    },
  }),
  autoLogging: true,
});
