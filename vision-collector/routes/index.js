// requirements
var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();

// GET home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// requirement
var mongoose = require('mongoose');
var passport = require('passport');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

// initialize middleware for authnticating our jwt tokens
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


// request: information of request to server including data fields sent
// response: object used to respond to the client
// next: 

// POST: reqister a user
router.post('/register', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all the fields'});
	}

	var user = new User();

	user.username = req.body.username;

	user.setPasssword(req.body.password);

	user.save(function(err){
		if(err){ return next(err); }
		return res.json({token: user.generateJWT()});
	});
});

// POST: user login
router.post('/login', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all the fields'});
	}

	passport.authenticate('local', function(err, user, info){
		if(err){ return next(err); }

		// if the user authenticates with pasport it returns a new JWT
		if(user){
			return res.json({token: user.generateJWT()});
		}else{
			return res.status(401).json(info);
		}
	})(req, res, next);
});

// POST ROUTE
// PARAM: require that the given post object is loaded before we view the page
// express param function to automaticaly load an object when its in the url
// when url route is defined with :post this function will run first
router.param('post', function(req, res, next, id){
	// when post is detected we query the database
	var query = Post.findById(id);
	// if query executes return error or post
	query.exec(function(err, post){
		// if error return error
		if (err) { return next(err); }
		// if no post return new error: cant find
		if (!post) { return next(new Error("Cant find post!")); }
		// otherwise if post is there set the post and return
		req.post = post;
		return next();
	});
});

// COMMENT ROUTE
// PARAM: require that the given post object is loaded before we view the page
// express param function to automaticaly load an object when its in the url
// when url route is defined with :post this function will run first
router.param('comment', function(req, res, next, id){
	// when post is detected we query the database
	var query = Comment.findById(id);
	// if query executes return error or post
	query.exec(function(err, post){
		// if error return error
		if (err) { return next(err); }
		// if no post return new error: cant find
		if (!post) { return next(new Error("Cant find post!")); }
		// otherwise if post is there set the post and return
		req.post = post;
		return next();
	});
});

// GET: go to database / get posts / return them 
router.get('/posts', function(req, res, next){
	// callback that returns error or gets posts
	Post.find(function(err, posts){
		// if error 
		if (err) { next(err); }
		// otherwise take posts and send to client via json
		res.json(posts);
	});
	// TEST: curl http://localhost:3000/posts
});

// GET: for returning a single post
router.get('/posts/:post', function(req, res){
	req.post.populate('comments', function(err, post){
		// take response and spit out json of the post
		res.json(post);
		// TEST: curl http://localhost:3000/posts/56f2d38f0b657ff0228fc23b
	});
});

// POST: create new post / post data to the server
router.post('/posts', auth, function(req, res, next){
	// take data we need from request and create new post from it
	var post = new Post(req.body);
	post.author = req.payload.username;
	// save post / return error or post itself if it gets saved
	post.save(function(err, post){
		// if error return next with error
		if (err) { return next(err); }
		// otherwise send post to client via json
		res.json(post);
	});
	// TEST: curl --data "title=test&link=http://test.com" http://localhost:3000/posts
});

// POST UPVOTE
// PUT: upvotes Route based on unique :post id
// calls upvote method outlined in mongo posts schema
router.put('/posts/:post/upvote', auth, function(req, res, next){
	// to upvote the post
	req.post.upvote(function(err, post){
		// if error return to error handler
		if (err){ return next(err); }
		// otherwise return to json and send to client
		res.json(post);
	});
	// TEST: curl -X PUT http://localhost:3000/posts/56f2d38f0b657ff0228fc23b/upvote	
});

// POST: create new comment
router.post('/posts/:post/comments', auth, function(req, res, next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;

	comment.save(function(err, comment){
		if (err){ return next(err); }

		req.post.comments.push(comment);
		req.post.save(function(err, post){
			if (err){ return next(err); }
			res.json(comment);
		});
	});
});

// COMMENT UPVOTE
// PUT: upvotes Route based on unique :post id
// calls upvote method outlined in mongo posts schema
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
	// to upvote the post
	req.comment.upvote(function(err, comment){
		// if error return to error handler
		if (err){ return next(err); }
		// otherwise return to json and send to client
		res.json(comment);
	});
	// TEST: curl -X PUT http://localhost:3000/posts/56f2d38f0b657ff0228fc23b/upvote	
});



module.exports = router;

// GET /posts - return a list of posts and associated metadata
// POST /posts - create a new post
// GET /posts/:id - return an individual post with associated comments
// PUT /posts/:id/upvote - upvote a post, notice we use the post ID in the URL
// POST /posts/:id/comments - add a new comment to a post by ID
// PUT /posts/:id/comments/:id/upvote - upvote a commen

// TEST 
// [{"_id":"56f2d38f0b657ff0228fc23b","title":"test","link":"http://test.com","__v"
// :0,"comments":[],"upvotes":0},{"_id":"56f2d3c00b657ff0228fc23c","title":"test","
// link":"http://test.com","__v":0,"comments":[],"upvotes":0},{"_id":"56f2e9460b657
// ff0228fc23d","title":"test","link":"http://test.com","__v":0,"comments":[],"upvo
// tes":0}]
// c:\Software>