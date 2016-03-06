"use strict";

class Helpers {
	/**
	 * Check if given value is a function
	 *
	 * @param {string} val
	 * @returns {boolean}
	 */
	static isFunction(val)
	{
		return (typeof val === 'function' && val !== null);
	}

	/**
	 * Checks if the given value is not empty
	 *
	 * @param value
	 * @returns {boolean}
	 */
	static isEmpty(value)
	{
		if ( this.isDefined(value) && (typeof value === 'object' || value instanceof Array ) )
		{
			return (typeof value === 'object') ? (Object.keys(value).length <= 0) : (value.length <= 0);
		}

		return (!this.isDefined(value) || value === '' || value === 0);
	}

	/**
	 * Check if the given value is defined
	 *
	 * @param val
	 * @returns {boolean}
	 */
	static isDefined(val)
	{
		return (typeof val !== 'undefined' && val !== null);
	}

	/**
	 * Check if the given value is an array
	 * @param val
	 * @returns {boolean}
	 */
	static isArray(val)
	{
		return Object.prototype.toString.call(val) === '[object Array]';
	}

	/**
	 * Converts a string foo_bar to FooBar
	 *
	 * @param str
	 * @returns {string}
	 */
	static toStudlyCase(str)
	{
		let arr = str.split('_');

		return arr.map(function (str)
		{
			return str.charAt(0).toUpperCase() + str.slice(1);
		}).join('');
	}

	/**
	 * Add quotes around column names
	 *
	 * @param {string|Array} columns
	 */
	static sanitize(columns)
	{
		let sanitized = [];

		function _quote(column)
		{
			let columnTable,
				table,
				safe = ['*'];

			if ( column.indexOf('.') > -1 )
			{
				columnTable = column.split('.');
				table = columnTable[0];
				column = columnTable[1];

				// "table".* or "table"."column"
				return (safe.indexOf(column) > -1) ? '"' + table + '".' + column : '"' + table + '"."' + column + '"';
			}

			return (safe.indexOf(column) > -1) ? column : '"' + column + '"';
		}

		if ( !Helpers.isArray(columns) )
		{
			return _quote(columns);
		}

		for (let c = 0; c < columns.length; c++)
		{
			sanitized.push(_quote(columns[c]));
		}

		return sanitized;
	}
}

class QueryColumn {
	constructor()
	{
		this.name = '';
		this.type = 'TEXT';
		this.isIncrementing = false;
		this.isNullable = false;
		this.isDefault = null;
	}

	/**
	 * Set the name of the column
	 *
	 * @param {string} name
	 */
	setName(name)
	{
		this.name = Helpers.sanitize(name);
	}

	/**
	 * Set the column to AUTOINCREMENT
	 *
	 * @returns {QueryColumn}
	 */
	autoincrement()
	{
		this.isIncrementing = true;

		return this;
	}

	/**
	 * Set the column to be nullable
	 *
	 * @returns {QueryColumn}
	 */
	nullable()
	{
		this.isNullable = true;

		return this;
	}

	/**
	 * Set the default value of the column
	 *
	 * @param {string|number} val
	 * @returns {QueryColumn}
	 */
	default(val)
	{
		this.isDefault = val;

		return this;
	}

	/**
	 * Set the column type to text
	 *
	 * @param {string} name
	 * @returns {QueryColumn}
	 */
	text(name)
	{
		this.setName(name);
		this.type = 'TEXT';

		return this;
	}

	/**
	 * Set the column type to INTEGER
	 *
	 * @param {string} name
	 * @returns {QueryColumn}
	 */
	integer(name)
	{
		this.setName(name);
		this.type = 'INTEGER';

		return this;
	}

	/**
	 * Get the column definition
	 *
	 * @returns {string}
	 */
	get()
	{
		let def = this.name + ' ' + this.type;

		if ( !this.isNullable )
		{
			def += ' NOT NULL';
		}

		if ( this.isIncrementing )
		{
			def += ' PRIMARY KEY AUTOINCREMENT';
		}

		if ( Helpers.isDefined(this.isDefault) )
		{
			def += ' DEFAULT(' + this.isDefault + ')';
		}

		return def;
	}
}

class QueryIterator {
	constructor()
	{
		this.current = 0;
		this.iterations = [];
		this.onComplete = function () {};
	}

	/**
	 * Call the next iteration
	 *
	 * @private
	 */
	_call()
	{
		let _this = this;

		if ( !Helpers.isEmpty(this.iterations) && !Helpers.isEmpty(this.iterations[this.current]) )
		{
			this.iterations[_this.current].call(this, function ()
			{
				_this.current++;

				_this._call();
			});

			return;
		}

		_this.onComplete();
	}

	/**
	 * Set the iteration for every item
	 *
	 * @param {Array} items
	 * @param {function} cb
	 * @returns {QueryIterator}
	 * @private
	 */
	_items(items, cb)
	{
		let i, item, _this = this;

		if ( Helpers.isDefined(items) && items.length > 0 )
		{
			for (i in items)
			{
				if ( items.hasOwnProperty(i) )
				{
					item = items[i];

					_this = (function (item, i, itemIterator)
					{
						itemIterator.add(function (next)
						{
							cb(item, next, i);
						});

						return itemIterator;
					})(item, i, _this);
				}
			}
		}

		return this;
	}

	/**
	 * Add an iteration of one or more items
	 *
	 * @param {function|Array} items
	 * @param {function} cb
	 * @returns {QueryIterator}
	 */
	add(items, cb)
	{
		if ( Helpers.isFunction(items) )
		{
			this.iterations.push(items);
			return this;
		}

		return this._items(items, cb);
	}

	/**
	 * Run all iterations
	 *
	 * @param {function} cb
	 */
	run(cb)
	{
		this.onComplete = cb;

		this._call();
	}
}

class QueryRelations {
	constructor()
	{
	}

	hasOne()
	{

	}

	hasMany()
	{

	}

	belongsTo()
	{

	}

	belongsToMany()
	{

	}
}

class QueryBuilder extends QueryRelations {
	constructor()
	{
		super();

		this.primaryKey = 'id';

		this.createColumns = [];
		this.createPrimaryKeys = [];

		this.updateColumns = [];

		this.query = '';
		this.values = [];

		this.joins = [];
		this.wheres = [];
		this.orderBys = [];
		this.limits = '';
	}

	/**
	 *
	 * @param tx
	 * @param e
	 * @private
	 */
	_errorCallback(tx, e)
	{
		let error = {};

		error.query = this.query;
		error.values = this.values;
		error.message = (e.message) ? e.message : '';

		this.errorCallback(error);
	}

	_setJoinQuery(query)
	{
		this.joins.push(query);
	}

	_getJoinQuery()
	{
		return ' ' + this.joins.join(' ');
	}

	/**
	 *
	 * @param boolean
	 * @param query
	 * @returns {string|*}
	 * @protected
	 */
	_setWhereQuery(boolean, query)
	{
		this.wheres.push({query: query, boolean: boolean});
	}

	_getWhereQuery()
	{
		if ( !Helpers.isEmpty(this.wheres) )
		{
			let where = 'WHERE ';
			for (let w = 0; w < this.wheres.length; w++)
			{
				if ( w == 0 )
				{
					where += this.wheres[w].query;
					continue;
				}

				where += ' ' + this.wheres[w].boolean + ' ' + this.wheres[w].query;
			}

			return where;
		}

		return '';
	}

	_setOrderByQuery(query)
	{
		if ( Helpers.isEmpty(this.orderBys) )
		{
			return this.orderBys.push('ORDER BY ' + query);
		}

		return this.orderBys.push(', ' + query);
	}

	_getOrderByQuery()
	{
		return ' ' + this.orderBys.join('');
	}

	_getLimitQuery()
	{
		return ' ' + this.limits;
	}

	/**
	 *
	 * @param column
	 * @param val
	 * @returns {Array}
	 * @protected
	 */
	_setValues(column, val)
	{
		let fn = this['set' + Helpers.toStudlyCase(column) + 'Attribute'];
		if ( Helpers.isFunction(fn) )
		{
			val = fn(val);
		}

		if ( Helpers.isArray(val) )
		{
			this.values = this.values.concat(val);

			return this.values;
		}

		this.values.push(val);

		return this.values;
	}

	/**
	 * Determine if we have results
	 *
	 * @param {SQLResultSet} res
	 * @returns {boolean}
	 * @protected
	 */
	_hasResults(res)
	{
		return Helpers.isDefined(res) && res.rows.length > 0;
	}

	/**
	 * Execute (perform) the query
	 *
	 * @param {string} query
	 * @param {function} cb
	 * @protected
	 */
	_perform(query, cb)
	{
		let _this = this;

		this.db.transaction(function (tx)
		{
			tx.executeSql(query, _this.values, cb, function (tx, e)
			{
				_this._errorCallback.call(_this, tx, e);
			});
		});
	}

	/**
	 * Handle the query results
	 *
	 * @param {SQLResultSet} res
	 * @param {function} cb
	 * @param {boolean} [obj=false]
	 * @protected
	 */
	_results(res, cb, obj)
	{
		obj = Helpers.isDefined(obj) ? obj : false;

		let results = obj ? {} : [];

		if ( this._hasResults(res) )
		{
			if ( !obj )
			{
				for (var r = 0; r < res.rows.length; r++)
				{
					results.push(res.rows.item(r));
				}

				// TODO call relations

				cb(results);
				return;
			}

			results = res.rows.item(0);
		}

		cb(results);
	}

	/**
	 *
	 * @protected
	 */
	_select(columns)
	{
		return "SELECT "
			   + Helpers.sanitize(columns).join(', ')
			   + " FROM "
			   + this.table
			   + this._getJoinQuery()
			   + this._getWhereQuery()
			   + this._getOrderByQuery()
			   + this._getLimitQuery();
	}

	/**
	 * Handles the default error callback. Can be overwritten if needed
	 *
	 * @param {Object} error
	 */
	errorCallback(error)
	{
		console.log('An error occured', JSON.stringify(error));
	}

	primary()
	{

	}

	/**
	 * Add a column definition
	 *
	 * @param {QueryColumn} column
	 */
	column(column)
	{
		this.createColumns.push(column.get());

		return this;
	}

	/**
	 * Add a where clause
	 *
	 * @param {string} column
	 * @param {string|number|Array} [operator='=']
	 * @param {string|number|Array} [val=]
	 * @param {string} [boolean='AND']
	 * @returns {QueryBuilder}
	 */
	where(column, operator, val, boolean)
	{
		let params = '?';

		if ( !val )
		{
			val = operator;
			operator = '=';
		}
		operator = operator || '=';
		boolean = boolean || 'AND';

		if ( Helpers.isFunction(column) )
		{
			return this.whereNested(column);
		}

		column = Helpers.sanitize(column);

		if ( Helpers.isArray(val) )
		{
			let parsedValues = [];
			for (let v in val) if ( val.hasOwnProperty(v) )
			{
				parsedValues.push('?');
			}

			params = '(' + parsedValues.join(',') + ')';
		}

		this._setWhereQuery(boolean, column + ' ' + operator + ' ' + params);
		this._setValues(column, val);

		return this;
	}

	/**
	 * Add a nested where clause
	 *
	 * @param {function} wheres
	 * @returns {QueryBuilder}
	 */
	whereNested(wheres)
	{
		let nested = wheres(new QueryBuilder(true)),
			lastIndex = (nested.wheres.length - 1);

		if ( nested.wheres[0] )
		{
			nested.wheres[0].query = '(' + nested.wheres[0].query;
		}

		if ( nested.wheres[lastIndex] )
		{
			nested.wheres[lastIndex].query = nested.wheres[lastIndex].query + ')';
		}

		this.wheres = this.wheres.concat(nested.wheres);
		this.values = this.values.concat(nested.values);

		return this;
	}

	/**
	 * Add a where IN clause
	 *
	 * @param {string} column
	 * @param {Array} val
	 * @param {string} [boolean='AND']
	 * @returns {QueryBuilder}
	 */
	whereIn(column, val, boolean)
	{
		return this.where(column, 'IN', val, boolean);
	}

	/**
	 * Add an OR-where clause
	 *
	 * @param {string} column
	 * @param {string|number|Array} [operator='=']
	 * @param {string|number|Array} [val=]
	 * @returns {QueryBuilder}
	 */
	orWhere(column, operator, val)
	{
		return this.where(column, operator, val, 'OR');
	}

	/**
	 * Add a join clause
	 *
	 * @param {string} table
	 * @param {string} first
	 * @param {string} operator
	 * @param {string} second
	 * @param {string} [type='INNER']
	 * @returns {QueryBuilder}
	 */
	join(table, first, operator, second, type)
	{
		type = type || 'INNER';
		first = Helpers.sanitize(first);
		second = Helpers.sanitize(second);

		this._setJoinQuery(type + ' JOIN ' + table + ' ON ' + first + ' ' + operator + ' ' + second);

		return this;
	}

	/**
	 * Add an order by clause
	 *
	 * @param {string} column
	 * @param {string} [dir='ASC']
	 * @returns {QueryBuilder}
	 */
	orderBy(column, dir)
	{
		dir = dir || 'ASC';

		this._setOrderByQuery(Helpers.sanitize(column) + ' ' + dir);

		return this;
	}

	/**
	 * Add a limit clause
	 *
	 * @param {number} limit
	 * @returns {QueryBuilder}
	 */
	limit(limit)
	{
		this.limits = 'LIMIT ' + limit;

		return this;
	}

	/**
	 * Add a where primaryKey clause
	 *
	 * @param {string|number} id
	 * @returns {QueryBuilder}
	 */
	id(id)
	{
		return this.where(this.primaryKey, id);
	}
}

class Eloquent extends QueryBuilder {
	constructor()
	{
		super();

		this.table = '';
		this.db = null;
	}

	/**
	 * Set the database instance
	 *
	 * @param {Database} [db=]
	 */
	setDatabase(db)
	{
		this.db = db || app.db;
	}

	/**
	 * Set a table alias
	 *
	 * @param {string} alias
	 * @returns {Eloquent}
	 */
	alias(alias)
	{
		this.table = this.table + ' AS ' + alias;

		return this;
	}

	/**
	 * Get the first record
	 *
	 * @param {Array|function} [columns=['*']]
	 * @param {function} [cb=]
	 */
	first(columns, cb)
	{
		let _this = this;

		columns = columns || ['*'];
		if ( Helpers.isFunction(columns) )
		{
			cb = columns;
			columns = ['*'];
		}

		this.query = this.limit(1)._select(columns);
		this._perform(this.query, function (tx, res)
		{
			_this._results(res, cb, true);
		});
	}

	/**
	 * Get all records that match the given statements
	 *
	 * @function all
	 * @param {Array|function} [columns=['*']]
	 * @param {function} [cb=]
	 */
	get(columns, cb)
	{
		this.all(columns, cb);
	}

	/**
	 * Get all records that match the given statements
	 *
	 * @param {Array|function} [columns=['*']]
	 * @param {function} [cb=]
	 */
	all(columns, cb)
	{
		let _this = this;

		columns = columns || ['*'];
		if ( Helpers.isFunction(columns) )
		{
			cb = columns;
			columns = ['*'];
		}

		this.query = this._select(columns);
		this._perform(this.query, function (tx, res)
		{
			_this._results(res, cb);
		});
	}

	/**
	 * Run a raw query
	 *
	 * @param {string} query
	 * @param {Array} values
	 * @param {function} cb
	 */
	raw(query, values, cb)
	{
		let _this = this;

		this.query = query;
		this.values = values;

		this._perform(this.query, function (tx, res)
		{
			_this._results(res, cb);
		});
	}

	/**
	 * Remove the records matching the given statements
	 *
	 * @param {function} cb
	 * @param {string|number} [id=]
	 * @param {string} [column=this.primaryKey]
	 */
	remove(cb, id, column)
	{
		let _this = this;

		if ( Helpers.isDefined(id) )
		{
			if ( !Helpers.isDefined(column) )
			{
				column = this.primaryKey;
			}

			this.where(column, '=', id);
		}

		this.query = 'DELETE FROM ' + this.table + ' ' + this._getWhereQuery() + ' ' + this._getLimitQuery();
		this._perform(this.query, function (tx, res)
		{
			_this._results(res, cb);
		});
	}

	/**
	 * Empties the table
	 *
	 * @param {function} cb
	 */
	empty(cb)
	{
		let _this = this;

		this.query = 'DELETE FROM ' + this.table;
		this._perform(this.query, function (tx, res)
		{
			_this._results(res, cb);
		});
	}

	/**
	 * Insert a record in the table
	 *
	 * @param {Object} data
	 * @param {function} cb
	 */
	insert(data, cb)
	{
		let params = [];

		for (var key in data)
		{
			if ( data.hasOwnProperty(key) )
			{
				this.values.push(data[key]);
				params.push('?');
			}
		}

		this.query = "INSERT INTO " + this.table + " (" + Helpers.sanitize(Object.keys(data)).join(', ') + ") VALUES (" + params.join(', ') + ")";
		this._perform(this.query, function (tx, res)
		{
			if ( Helpers.isDefined(res.rowsAffected) && res.rowsAffected > 0 )
			{
				cb(Helpers.isDefined(res.insertId) ? res.insertId : 0);
			}
		});
	}

	/**
	 * Add(insert) a record to the table
	 *
	 * @function all
	 * @param {Object} data
	 * @param {function} cb
	 */
	add(data, cb)
	{
		this.insert(data, cb);
	}

	/**
	 * Update a record in the table
	 *
	 * @param {Object} data
	 * @param {function} cb
	 * @param {string|number} [id=]
	 * @param {string} [column=this.primaryKey]
	 */
	update(data, cb, id, column)
	{
		let newValues = [];

		if ( Helpers.isDefined(id) )
		{
			if ( !Helpers.isDefined(column) )
			{
				column = this.primaryKey;
			}

			this.where(column, '=', id);
		}

		for (var key in data)
		{
			if ( data.hasOwnProperty(key) )
			{
				this.updateColumns.push(Helpers.sanitize(key) + ' = ?');
				newValues.push(data[key]);
			}
		}

		this.values = newValues.concat(this.values);
		this.query = "UPDATE " + this.table + " SET " + this.updateColumns.join(', ') + " " + this._getWhereQuery() + " " + this._getLimitQuery();
		this._perform(this.query, function (tx, res)
		{
			cb(Helpers.isDefined(res.rowsAffected) && res.rowsAffected > 0);
		});
	}

	/**
	 * Drop the table
	 *
	 * @param {function} [cb=]
	 */
	drop(cb)
	{
		cb = cb || function () {};

		this.raw('DROP TABLE IF EXISTS ' + this.table, [], cb);
	}

	/**
	 * Create the table
	 *
	 * @param {function} cb
	 */
	create(cb)
	{
		let query = 'CREATE TABLE IF NOT EXISTS ' + this.table;

		if ( Helpers.isEmpty(this.createColumns) )
		{
			console.error('No columns defined to create table with');
			return;
		}

		query += ' (' + this.createColumns.join(', ');

		if ( !Helpers.isEmpty(this.createPrimaryKeys) )
		{
			query += ', PRIMARY KEY (' + this.createPrimaryKeys.join(',') + ')';
		}

		query += ')';
		this.raw(query, [], cb);
	}
}

/*
TODO
- Primary Keys
- Relations
- get{Attribute}Attribute
 */