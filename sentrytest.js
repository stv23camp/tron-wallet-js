require('dotenv').config();

/*------ sentry initialization ------*/
// const Sentry = require('@sentry/node');

// Sentry.init({
//     dsn: process.env.SENTRYDSN,
//     integrations: [
//         // enable HTTP calls tracing
//         new Sentry.Integrations.Http({tracing: true}),
//     ],
//     environment: process.env.SENTRYENV,
//     tracesSampleRate: 1.0,
// });

// Sentry.configureScope(scope => {
//     scope.setTag('coin_protocol', process.env.PROTOCOL);
// });

const sentry = require('../library/sentry_obj');

function callB(){
    throw new Error('callB error');
}

function callA(){
    return callB();
}

//callA(); // does not trigger sentry automatically

/*--------- THIS TEST IS SUCCESS -----------*/
(
() => {
    try {
        callA();
    } catch(e) {
        sentry.captureException(e);
    }
}

)();