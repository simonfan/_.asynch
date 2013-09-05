define(['underscore','jquery'], function(undef, $) {

	/////////////////////////////
	//////// asynch /////////////
	/////////////////////////////
	_.mixin({
		// _.asynch(common_obj, func1, func2, func3);
		asynch: function() {
			/**
			 * options:
			 * 	- tasks
			 * 	- common
			 * 	- map
			 *	- error handler
			 */

			var first_arg_is_object = typeof arguments[0] === 'object',
				// if the first argument is an object,
				// then it should be considered an options object.
				// otherwise, there is no options object
				options = first_arg_is_object ? arguments[0] : {},

				// the common object
				common = options.common || {},

				// the error handler
				err = options.err || function() {},

				// the list of the names of the tasks to be executed
				map = options.map,

				// the function to be run before each task
				before = options.before || function(){},

				// the function to be run after each task
				after = options.after || function(){},

				// context in which the functions should be called
				context = options.context || window,
				lastdefer = true,
				tasks;

			// define the tasks array
			if (first_arg_is_object) {
				// if the first argument is an options object,
				// then there are two possibilities:
				//	1: there is a 'tasks' property in the options object itself
				//	2: tasks were passed in as arguments
				tasks = options.tasks || _.rest(arguments, 1);
			} else {
				// if the first argument is not an options object
				// the tasks are the arguments object itself.
				tasks = arguments;
			}

			_.each(tasks, function (task, order) {
				/*
					This code is pretty tricky:
					1: lastdefer starts as true, so that the first task is instantly run.
					2: lsatdefer value is updated at each task loop.
					3: 'when' lastdefer is resolved, a function creates a new defer
						and passes it to the next task. 
					4: if the next task returns a not undefined object, it is set as 
						the 'lastdefer'. This is done so that tasks may return a promise instead 
						of calling next function.
				*/
				
				// only start the new task when the previous one is finished.
				lastdefer = $.when(lastdefer).then(function() {

					// call the after function
					if (order !== 0) {
						var lasttask = typeof map === 'undefined' ? order - 1 : map[ order - 1 ];
						after.call(context, lasttask);
					}

					// call the before function
					var currtask = typeof map === 'undefined' ? order : map[ order ];
					before.call(context, currtask);

					// create the defer object.
					var defer = $.Deferred(),
						next = defer.resolve,
						res = task.call(context, next, common);

					return typeof res !== 'undefined' ? res : defer;
				});

				// set error handler
				lastdefer.fail(err);
			});

			// call the last after
			lastdefer.then(function() {
				var lasttask = typeof map === 'undefined' ? tasks.length - 1 : map[ tasks.length -1 ];
				after.call(context, lasttask);
			})

			// return a defer object.
			return lastdefer;
		},
	});

});