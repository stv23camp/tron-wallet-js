# js-tron-middleware
Js implementation of Tron middleware

## Structure
```
├── src
├──── configs
├─────── token.config.json
├──── controllers
├─────── accounts.js
├─────── db_init.js
├─────── deposit.js
├─────── forward.js
├─────── network.js
├─────── payment.js
├─────── transactions.js
├──── library
├─────── db_mysql.js
├─────── db_sqlite.js
├─────── encryption.js
├─────── sentry_obj.js
├─────── tron.js
├──── services
├─────── db_migration.js
├─────── deposit_trc20.js
├─────── deposit_trx.js
├─────── forward_trc20.js
├─────── forward_trx.js
├───── utils
├─ test
├──── unit
├─ index.js
├─ .env
├─ package-lock.json
├─ package.json
└─ README.md
```

## config
`config` directory contains json files that contains key-value configs for each TRC20 token.

## controller
`controller` contains logic that are being consumed via rpc calls.

- accounts: contains account related functions such as validateAddress.
- db_init: logic to freshly set the app on a new machine
- deposit: logic to scan each block for our incoming deposit
- forward: logic to move balance from unique individual user's account to pool account
- network: contains blockchain network check function such as getBlockCount;
- payment: contains transfer function.
- transactions: contains function to prep and return list of transactions.