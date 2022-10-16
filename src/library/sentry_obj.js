require('dotenv').config();
/*------ sentry initialization ------*/
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRYDSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({tracing: true}),
    ],
    environment: process.env.SENTRYENV,
    tracesSampleRate: 1.0,
});

Sentry.configureScope(scope => {
    scope.setTag('coin_protocol', process.env.PROTOCOL);
});

module.exports = Sentry;