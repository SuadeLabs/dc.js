[![Build Status](https://api.travis-ci.org/dc-js/dc.js.svg?branch=master)](http://travis-ci.org/dc-js/dc.js)
[![Sauce Status](https://saucelabs.com/buildstatus/sclevine)](https://saucelabs.com/u/sclevine)
[![NPM Status](https://badge.fury.io/js/dc.svg)](http://badge.fury.io/js/dc)
[![cdnjs Status](https://img.shields.io/cdnjs/v/dc?color=green)](https://cdnjs.com/libraries/dc)
[![Join the chat at https://gitter.im/dc-js/dc.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dc-js/dc.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A note before continuing
=====
This is fork of the [dc.js plugin](https://github.com/dc-js/dc.js) adapted to add multiple Y Axis support
PLEASE NOTE: this update solves an issue primarily for [Suade Labs](https://suade.org/) and is subject to change.

dc.js
=====
Dimensional charting built to work natively with [crossfilter](http://crossfilter.github.io/crossfilter/)
rendered using [d3.js](https://d3js.org/).

In dc.js, each chart displays an aggregation of some
attributes through the position, size, and color of its elements, and also presents a dimension
which can be filtered. When the filter or brush changes, all other charts are updated dynamically,
using animated transitions.

Check out the [example page](http://dc-js.github.io/dc.js/)
and its [annotated source](http://dc-js.github.io/dc.js/docs/stock.html) for a quick five minute
how-to guide. The detailed [API reference is here](http://dc-js.github.io/dc.js/docs/html/)
([markdown version](https://github.com/dc-js/dc.js/blob/master/docs/api-latest.md)). For
more examples and hints please visit the [Wiki](https://github.com/dc-js/dc.js/wiki).

Install with npm
--------------------
```
npm install @suadelabs/dc
```


Install without npm
--------------------
Download
* [d3.js](https://github.com/mbostock/d3)
* [crossfilter.js](https://github.com/crossfilter/crossfilter)
* [dc.js - stable](https://github.com/dc-js/dc.js/releases)
* [dc.js - bleeding edge (develop)](https://github.com/dc-js/dc.js)


How to build dc.js locally
---------------------------

### Prerequisite modules

Make sure the following packages are installed on your machine
* node.js
* npm

### Install dependencies
```
$ npm install
```

### Build and Test
```
$ grunt test
```

Developing dc.js
----------------

### Start the development server
```
$ grunt server
```

* Jasmine specs are hosted at http://localhost:8888/spec
* The stock example is at http://localhost:8888/web
* More examples are at http://localhost:8888/web/examples

License
--------------------

dc.js is an open source javascript library and licensed under
[Apache License v2](http://www.apache.org/licenses/LICENSE-2.0.html).
