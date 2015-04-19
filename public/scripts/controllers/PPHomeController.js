(function(){
	angular.module('pizzaplay').controller("PPHomeController",function($scope,$http){

		$scope.loading = false;

		$scope.go = function(){
			$scope.loading = true;
			$http.get('/spotify/'+$scope.user).success(function(data){
				$scope.toppings = data.toppings;
				$scope.playlists = data.playlists;
				$scope.notFirst = true;
				$scope.loading = false;
			});
		}

		$scope.goPlaylist = function(){
			var pl = $scope.playlist.split("~");
			$scope.playlistname = pl[0];
			$scope.loading = true;

			$http.get('/spotify/'+pl[1]+'/'+pl[0]).success(function(data){
				$scope.toppings = data.toppings;
				$scope.loading = false;
			});
		}

		$http.get('/baelor').success(function(data){
			$scope.inspiration = data;
		});

	});
})();