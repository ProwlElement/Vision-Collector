angular.module('visionCollector', ['ui.router'])
// config block for configuration settings
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider){
	// state provider
	$stateProvider
	// home state
	.state('home', {
		url: '/home',
		templateUrl: '/home.html',
		controller: 'MainCtrl',
		// only show if the post get all is successful 
		resolve:{
			postPromise: ['posts',  function(posts){
				return posts.getAll();
			}]
		}
	})
	// posts state
	.state('posts', {
		url: '/posts/{id}',
		templateUrl: '/posts.html',
		controller: 'PostsCtrl',
		resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts){
				// return the id from the url
				return posts.get($stateParams.id);
			}]
		}
	})
	//login state
	.state('login', {
		url: '/login',
		templateUrl: '/login.html',
	 	controller: 'AuthCtrl',
	 	onEnter: ['$state', 'auth', function($state, auth){
	    	if(auth.isLoggedIn()){
	        	$state.go('home');
			}
		}]
	})
	.state('register', {
		url: '/register',
		templateUrl: '/register.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth){
	    	if(auth.isLoggedIn()){
	      		$state.go('home');
	    	}
	  	}]
	});


	// for bad routes to redirect
	$urlRouterProvider.otherwise('home');

}])
// factory service for authentication
.factory('auth', ['$http', '$window','$rootScope', function($http, $window, $rootScope){
	var auth = {

		saveToken: function (token){
	      $window.localStorage['vision-collector-token'] = token;
	    },
	    getToken: function (){
	      return $window.localStorage['vision-collector-token'];
	    },
	    isLoggedIn: function(){
	      var token = auth.getToken();

	      if(token){
	        var payload = JSON.parse($window.atob(token.split('.')[1]));
	        
	        return payload.exp > Date.now() / 1000;
	      } else {
	        return false;
	      }
	    },
	    currentUser: function(){
	      if(auth.isLoggedIn()){
	        var token = auth.getToken();
	        var payload = JSON.parse($window.atob(token.split('.')[1]));

	        return payload.username;
	      }
	    },
	    register: function(user){
	      return $http.post('/register', user).success(function(data){
	        auth.saveToken(data.token);
	      });
	    },
	    logIn: function(user){
	      return $http.post('/login', user).success(function(data){
	        auth.saveToken(data.token);
	      });
	    },
	    logOut: function(){
	      $window.localStorage.removeItem('vision-collector-token');
	    }
	};

	return auth;
}])
// factory service to allow data object for global use / http injector
.factory('posts', ['$http', function($http){
	// object to hold posts
	var o = {
		posts: []
	};
	//funstion to get all posts usinh http request
	o.getAll = function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data, o.posts);
		});
	}
	//funstion to get id for post
	o.get = function(id){
		return $http.get('/posts/'+id).then(function(res){
			return res.data;
		});
	}
	// create new post
	o.create = function(post){
		return $http.post('/posts', post).success(function(data){
			o.posts.push(data);
		});
	}
	// upvote
	o.upvote = function(post){
		return $http.put('/posts/'+post._id+'/upvote').success(function(data){
			post.upvotes += 1;
		});
	}
	// add comment
	o.addComment = function(id, comment){
		return $http.post('/posts/'+id+'/comments', comment);
	}
	// upvote comment
	o.upvoteComment = function(post, comment){
		return $http.put('/posts/'+post._id+'/comments/'+comment._id+'/upvote').success(function(data){
			comment.upvotes += 1;
		});
	}
	return o;
}])
// MainCtrl
.controller('MainCtrl', [
'$scope',
'posts',
function($scope, posts){
	$scope.test = 'Techno Freedom!';

	$scope.posts = posts.posts;

	$scope.addPost = function() {
		if ($scope.title === '') {return;}

		posts.create({
			title: $scope.title,
			link: 'http://'+ $scope.link,
		});

		$scope.title = '';
		$scope.link = '';
	}

	$scope.incrementUpvotes = function(post){
		posts.upvote(post);
	}
}])
// PostsCtrl
.controller('PostsCtrl', [
'$scope', 
'$stateParams',
'posts',
'post',
function($scope, $stateParams, posts, post){
	$scope.post = post;

	$scope.addComment = function() {
		if ($scope.body === '') {return;}

		posts.addComment(post._id, {
			body: $scope.body,
			author: 'user'
		}).success(function(comment){
			$scope.post.comments.push(comment);
		});

		$scope.body = '';
	}

	$scope.incrementUpvotes = function(comment){
		posts.upvoteComment(post, comment);
	}
}])
.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		}

		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		}
}])
.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);