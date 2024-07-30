# page-loader:
[![Actions Status](https://github.com/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/actions) [![Maintainability](https://api.codeclimate.com/v1/badges/51fa0ac822e7404cfe3c/maintainability)](https://codeclimate.com/github/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/51fa0ac822e7404cfe3c/test_coverage)](https://codeclimate.com/github/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/test_coverage) [![Node.js CI](https://github.com/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/actions/workflows/ci.yml/badge.svg)](https://github.com/EkaterinaMavliutova/qa-auto-engineer-javascript-project-67/actions/workflows/ci.yml)

**page-loader** is a CLI tool that downloads web pages to the chosen directory, so to access them without the internet connection

## Installation
>note: the current version of page-loader requires Node.js v20.11.1 or higher
* clone this repository
* to install required dependencies:
```
make install
```
* to install page-loader globally:
```
npm link
```

## How to use
```
Usage: page-loader [options] <URL>

Options:
  -V, --version       output the version number
  -o, --output [dir]  output dir (default: current working dir)
  -h, --help          display help for command
```
## page-loader recordings on asciinema.org
### downloading https://sourcemaking.com:
<a href="https://asciinema.org/a/bnUs1c2IzexhCdsfhHXAAN1oM" target="_blank"><img src="https://asciinema.org/a/bnUs1c2IzexhCdsfhHXAAN1oM.svg" width="50%" height="50%"/></a>

### error handling:
<a href="https://asciinema.org/a/8G4ZyrFraGzKIWsPUJKg9dI1A" target="_blank"><img src="https://asciinema.org/a/8G4ZyrFraGzKIWsPUJKg9dI1A.svg" width="50%" height="50%"/></a>

### logging with debug library:
<a href="https://asciinema.org/a/xgMYPaBdccpORu0FOBNai4dEE" target="_blank"><img src="https://asciinema.org/a/xgMYPaBdccpORu0FOBNai4dEE.svg" width="50%" height="50%"/></a>

### logging with axios library:
<a href="https://asciinema.org/a/5YfoAfSJVpexdQ1Ao6gPRRm0g" target="_blank"><img src="https://asciinema.org/a/5YfoAfSJVpexdQ1Ao6gPRRm0g.svg" width="50%" height="50%"/></a>