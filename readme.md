# Eloquent for SQLite in Javascript [![Build Status](https://travis-ci.org/sestolk/javascript-eloquent.svg?branch=master)](https://travis-ci.org/sestolk/javascript-eloquent)

## Story of origin
This is a class I wrote with which you can write [Eloquent](http://laravel.com/docs/eloquent) style Queries in Javascript that works with a SQLite database.
~~I wrote it for usage in [Cordova Apps](http://cordova.apache.org/) with the [Cordova SQLite Plugin](https://github.com/brodysoft/Cordova-SQLitePlugin)~~. It works fine (even better) without this plugin as long as the Webview is using Webkit.

## Environments in which to use
* Browser-based apps using Webkit (Chrome, Safari)

# Installation
Check the included [index.html](../index.html) for a live example and installation. It is fairly straightforward, but If you really don't know. You know where to find me!

# Usage

## Available Queries
Below you will find some examples of the available Queries. More will surely be added, but as far as I can see, these are the most important ones.

### Create table
Create the table of the model

Examples:
``` javascript
var MarketModel = function ()
{
	//...
	this.createModel = function ( callback )
	{
		_this.createColumn('id', 'INTEGER')
			.createColumn('user_id', 'INTEGER')
			.createColumn('name', 'TEXT')
			.primaryKey(['id', 'user_id']) // Create a combined primary key
			.createTable(callback);
	};
	//...
};

new MarketModel().createModel(function(){});
```

### Drop table
Drop/remove the table of the model

Examples:
``` javascript
new MarketModel().drop(function(){});
```

### Truncate table
Empty/truncate the table of the model

Examples:
``` javascript
new MarketModel().empty(function(){});
```

### Select Queries
As you would expect from a normal Query, *__where__* aswell as *__orderBy__* clauses are optional and can be repeated as many times as needed. Order of calling is not important.

The *__first__*, *__get__* or *__all__* methods should be called last as they will return the results to your callback (2nd argument).
In the first argument you can define the columns that should be returned, an empty array will return **\*** (read: all) columns.

Examples:
``` javascript
// One result
// Query: "SELECT * FROM markets WHERE id = 5 ORDER BY id DESC LIMIT 1"
new MarketModel().where('id', '=', 5).orderBy('id', 'DESC').first([], function(){});

// or multiple results
// Query: "SELECT * FROM markets WHERE id = 5 ORDER BY id ASC"
new MarketModel().where('id', '=', 5).orderBy('id').get([], function(){});

// synonym for get
// Query: "SELECT id, name FROM markets ORDER BY id DESC"
new MarketModel().orderBy('id', 'DESC').all(['id', 'name'], function(){});
```

### Insert Query
Unlike with the Update Query, where and orderBy clauses are ignored. So there is no point of chaining them.

Examples:
``` javascript
// Query: "INSERT INTO markets (test, test1) VALUES ('1235', 'qwerty')"
new MarketModel().column('test', '1235').column('test1', 'qwerty').add(function (){});
```

**NOTE:** *__column__* clauses are optional and can be repeated as many times as needed.

### Update Query
Update the selected records with the given data.

Examples:
``` javascript
// These two examples will produce the same Query
// Query: "UPDATE markets SET test = '1235', test2 = 'qwerty' WHERE id = 5"
new MarketModel().set('test', '1235').set('test2', 'qwerty').where('id', '=', 5).update(function (){});
// Or
new MarketModel().set('test', '1235').set('test2', 'qwerty').update(function (){}, 5);
```

**NOTE:** *__set__* aswell as *__where__* and *__orderBy__* clauses are optional and can be repeated as many times as needed. Order of calling is not important.

### Remove Query
Remove the selected records from the table.

Examples:
``` javascript
// These two examples will produce the same Query
// Query: "DELETE FROM markets WHERE id = 5"
new MarketModel().where('id', '=', 5).remove(function(){});
// Or
new MarketModel().remove(function(){}, 5);
```

**NOTE:** *__where__* clauses are optional and can be repeated as many times as needed. *__orderBy__* clauses are ignored. Order of calling is not important.

### Where clauses
There are several different ways to use the where clauses. A few examples are shown below.

Examples:
``` javascript
// #1
new MarketModel().where('id', 'IN', [1,2,3])...
// #2
new MarketModel().where('id', 'NOT IN', [1,2,3])...
// #3
new MarketModel().where('id', '=', 1).orWhere('id', '=', '2')...
// #4
new MarketModel().whereNested(function(q)
{
    // Results in WHERE (id = 1 OR id = 2)
    return q.where('id', '=', 1).orWhere('id', '=', '2');
})...
```

### Raw Queries
For the occassions a query can not be created using Eloquent or is simply to complex, you can just write the entire query yourself.

Examples:
``` javascript
var marketModel = new MarketModel();
marketModel.raw("SELECT * FROM " + marketModel.table + "<YOUR COMPLEX QUERY HERE>");
```

### Relationships
There are several ways a model can have a relationship with another model. It can belong to one model (belongsTo) or many (belongsToMany), it can have one model (hasOne) or many (hasMany).

Examples:
``` javascript
// For example when a Market belongs to a city you define its relationship as follows
// MarketModel.js
this.city = function ()
{
	return _this.belongsTo('CityModel', 'city_id', 'id', arguments);
};

// You call this relationship when you retrieve records from the MarketModel.
new MarketModel().relations('city').get([], function(){});

// You can of course also reverse this relationship by defining it as follows
// CityModel.js
this.markets = function ()
{
	return _this.hasMany('MarketModel', 'city_id', 'id', arguments);
};

// And call it like so
new CityModel().relations('markets').get([], function(){});
```

## Future update(s)
* Timestamps
* Soft deletion
* Record touching
* ~~WhereIn, WhereNotIn clauses~~
* ~~Use of auto incrementing columns~~
* ~~Raw Query~~
* ~~Relationships~~

### Author(s)
* Sven Stolk
  * Usability Laboratory