// require mongoose to access it
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
	title: String,
	link: String,
	upvotes: { type: Number, default: 0},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]

});

// Upvote
// extend the post schema to have methods
// function takes a callback (cb)
PostSchema.methods.upvote = function(cb){
	// increment upvotes by one
	this.upvotes += 1;
	// save to db and execute the call back (cb) 
	this.save(cb);
	// INFO: this method will run based on a route when a user clicks on an upvote
	// when a user clicks it will hit our server, run this method, give a response
	// route in index.ejs
}

mongoose.model('Post', PostSchema);