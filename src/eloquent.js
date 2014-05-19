/**
 * THE SQELOQUENT MODEL
 * ------------------------
 * This model uses handy functions to replacte the Laravel Eloquent db management syntax for SQLite.
 *
 * @company Usability Laboratory
 * @authors Sven Stolk
 *
 * @constructor
 *
 * @return {Eloquent}
 */
function Eloquent()
{
	this.db = app.Database;
	this.primary_key = 'id';
	this.timestamps = true;
	this.table = '';

	/**
	 * End of Statement
	 * Resets/Initializes variables for the Builder
	 *
	 * @constructor
	 */
	this.EoS = function ()
	{
		// Builder Vars
		this.query = '';
		this.whereStarted = false;
		this.whereQuery = '';
		this.orderByStarted = false;
		this.orderByQuery = '';
		this.setStarted = false;
		this.setQuery = '';
		this.columns = [];
		this.parameters = [];
		this.values = [];
	};

	this.EoS();

	return this;
}

/**
 *
 *
 * @param column
 * @param [operator="="]
 * @param value
 * @param [statement="AND"]
 *
 * @return {Eloquent}
 */
Eloquent.prototype.where = function (column, operator, value, statement)
{
	var _this = this;

	if ( typeof statement === 'undefined' )
	{
		statement = 'AND';
	}

	if ( !_this.whereStarted )
	{
		_this.whereQuery = 'WHERE ';
		_this.whereStarted = true;
	}
	else
	{
		_this.whereQuery += ' ' + statement + ' ';
	}

	_this.whereQuery += column + ' ' + operator + ' ?';
	_this.values.push(value);

	return this;
};

/**
 *
 * @param column
 * @param dir
 * @returns {Eloquent}
 */
Eloquent.prototype.orderBy = function (column, dir)
{
	var _this = this;

	if ( typeof dir === 'undefined' )
	{
		dir = 'ASC';
	}

	if ( !_this.orderByStarted )
	{
		_this.orderByQuery = 'ORDER BY ';
		_this.orderByStarted = true;
	}
	else
	{
		_this.orderByQuery += ', ';
	}

	_this.orderByQuery += column + ' ' + dir;

	return this;
};

/**
 *
 * @param columns
 * @returns {string}
 */
Eloquent.prototype.select = function (columns)
{
	var _this = this;

	if ( typeof columns === 'undefined' || columns.length == 0 )
	{
		columns = ['*'];
	}

	_this.query = "SELECT " + columns.join(', ') + " FROM " + _this.table + " " + _this.whereQuery + " " + _this.orderByQuery;

	return _this.query;
};

/**
 * Retrieve the first record
 *
 * @param [columns=["*"]]
 * @param callback
 * @returns {Eloquent}
 */
Eloquent.prototype.first = function (columns, callback)
{
	var _this = this;

	_this.db.transaction(function (tx)
	{
		tx.executeSql(_this.select(columns) + " LIMIT 1", _this.values, function (tx, res)
			{
				callback(res.rows.item(0));
			},
			_this._defaultErrorCallback);
	});

	_this.EoS();

	return this;
};

/**
 * Retrieve all records
 *
 * @param [columns=["*"]]
 * @param callback
 * @returns {Eloquent}
 */
Eloquent.prototype.get = function (columns, callback)
{
	var _this = this;

	_this.db.transaction(function (tx)
	{
		tx.executeSql(_this.select(columns), _this.values, function (tx, res)
			{
				callback(res.rows.item(0));
			},
			_this._defaultErrorCallback);
	});

	_this.EoS();

	return this;
};

/**
 * Same as Get
 *
 * @param columns
 * @param callback
 * @returns {Eloquent}
 */
Eloquent.prototype.all = function (columns, callback)
{
	return this.get(columns, callback);
};

/**
 * Retrieve the first record
 *
 * @param callback
 * @param [id=]
 * @param [column=]
 * @returns {Eloquent}
 */
Eloquent.prototype.delete = function (callback, id, column)
{
	var _this = this;

	if ( typeof id !== 'undefined' )
	{
		if ( typeof column === 'undefined' )
		{
			column = _this.primary_key;
		}

		_this.where(column, '-', id);
	}

	_this.query = "DELETE FROM " + _this.table + " " + _this.whereQuery;

	_this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				callback();
			},
			_this._defaultErrorCallback);
	});

	_this.EoS();

	return this;
};

/**
 *
 * @param {String} column
 * @param {String} value
 * @returns {Eloquent}
 */
Eloquent.prototype.column = function (column, value)
{
	var _this = this;

	_this.columns.push(column);
	_this.parameters.push('?');
	_this.values.push(value);

	return this;
};

/**
 * Add a new record
 *
 * @param callback
 * @returns {Eloquent}
 */
Eloquent.prototype.add = function (callback)
{
	var _this = this;

	_this.query = "INSERT INTO " + _this.table + " (" + _this.columns.join(', ') + ") VALUES (" + _this.parameters.join(', ') + ")";

	_this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				callback();
			},
			_this._defaultErrorCallback);
	});

	_this.EoS();

	return this;
};

/**
 *
 *
 * @param column
 * @param value
 *
 * @return {Eloquent}
 */
Eloquent.prototype.set = function (column, value)
{
	var _this = this;

	if ( !_this.setStarted )
	{
		_this.setQuery = 'SET ';
		_this.setStarted = true;
	}
	else
	{
		_this.setQuery += ', ';
	}

	_this.setQuery += column + ' = ?';
	_this.values.push(value);

	return this;
};

/**
 * Update a record
 *
 * @param callback
 * @param [id=]
 * @param [column=]
 * @returns {Eloquent}
 */
Eloquent.prototype.update = function (callback, id, column)
{
	var _this = this;

	if ( typeof id !== 'undefined' )
	{
		if ( typeof column === 'undefined' )
		{
			column = _this.primary_key;
		}

		_this.where(column, '-', id);
	}

	_this.query = "UPDATE " + _this.table + " " + _this.setQuery + " " + _this.whereQuery;

	_this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				callback();
			},
			_this._defaultErrorCallback);
	});

	_this.EoS();

	return this;
};

/**
 *
 * @param e
 * @private
 */
Eloquent.prototype._defaultErrorCallback = function (e)
{
	console.log('An error occured:' + e.message);
};