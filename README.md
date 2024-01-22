# alarm.com Automation

This package provides a few script to automate Alarm.com actions using Playwright.

Currently, it supports:
* logging in with username / password and TOTP 2FA
* creating users with a temporary access

## Installation

After cloning the repository, install the NPM packages required:

```sh
npm install
```

## Scripts

### createUser.js

Usage: 

```sh
node dist/src/createUser.js -f _firstName_ -l _lastName_ -s _startDate_ -e _endDate_
```

Where the dates are in the format `YYYY-MM-DD`

