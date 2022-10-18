/*------ dependencies import ------*/
require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const express = require('express');
const helmet = require('helmet');
const authenticate = require('./src/middleware/authenticate');
const morgan = require('morgan');
var db_init = require('./src/controllers/db_init');

/*------ sentry import ------*/
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

// instantiate express
const app = express();

/*------ sentry initialization ------*/
Sentry.init({
    dsn: process.env.SENTRYDSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({tracing: true}),
        // enable Express.js middleware tracing 
        new Tracing.Integrations.Express({app}),
    ],
    environment: process.env.SENTRYENV,
    tracesSampleRate: 1.0,
});

Sentry.configureScope(scope => {
    scope.setTag('coin_protocol', process.env.PROTOCOL);
});

/*----- sentry middleware -----*/
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

/*----- middlewares -----*/
app.use(morgan('tiny'));
app.use(helmet());
app.use(xmlrpc.bodyParser);
app.use(authenticate); 

/*----- controllers -----*/
const contAccounts = require('./src/controllers/accounts');
const contPayment = require('./src/controllers/payment');
const contNetwork = require('./src/controllers/network');
const contTransactions = require('./src/controllers/transactions');

const routes = {
    GenerateAddress: contAccounts.generateAddress, 
    validateaddress: contAccounts.validateAddress, 
    GetBalance: contAccounts.getNativeBalance, 
    GetTokenBalance: contAccounts.getTokenBalance, 
    transfertoken: contPayment.transferToken, 
    transferNative: contPayment.transferNative, 
    GetNowBlockNum: contNetwork.getBlockCount,
    ListTransactions: contTransactions.getPaymentsNative,
    ListTokenTransactions: contTransactions.getPaymentsTrc20
}

app.post('/tronrpc', xmlrpc.apiHandler(routes));

/*----- sentry error handler after controllers-----*/
app.use(Sentry.Handlers.errorHandler());

/*------ have async processes before express starts listening ------*/
const start = async function() {
    try {
        await db_init.nonceInit()
        app.listen(process.env.PORT, () => console.log('server started'));
    } catch(e) {
        Sentry.captureException(e);
        console.log('unable to establish Nonce DB, exiting...');
        process.kill(process.pid);
    }
}

start();

