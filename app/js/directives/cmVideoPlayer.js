/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
	.directive('cmVideoPlayer', ['DateUtils', function (DateUtils) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				scope.model.play_state = false;
				scope.model.current_time = 0;
				scope.model.infbndsec;
				scope.model.loop = true;

				//add a loop button for controlling looping
                scope.model.loop_display = function() {
                    scope.model.loop = !scope.model.loop;
                };

				scope.model.toggle_play = function (value) {
					if (scope.model.play_state !== undefined) {
						if (value !== undefined) {
							scope.model.play_state = value;
						} else {
							scope.model.play_state = !scope.model.play_state;
						}

						if (scope.model.play_state) {
							element[0].play();
						} else {
							element[0].pause();
						}
					}
				};

				var save_state;

				$('#seek-bar').on('mousedown',function () {
					save_state = scope.model.play_state;
					scope.$apply(function () {
						scope.model.toggle_play(false);
					});

				}).on('mouseup', function () {
						scope.$apply(function () {
							element[0].currentTime = scope.model.view_current_time;
							scope.model.toggle_play(save_state);
						});
					});

				scope.model.play_label = "Play";

				element[0].addEventListener("loadedmetadata", function () {
					scope.$apply(function () {
						element[0].currentTime = scope.model.current_time;
					});
				});

				element[0].addEventListener("timeupdate", function() {
                    scope.$apply(function() {

                        var currentTime = element[0].currentTime;
            			scope.model.view_current_time = currentTime;
            			scope.model.current_time_display = DateUtils.timestampFormat(DateUtils.parseDate(currentTime));
						if (currentTime > scope.model.supbndsec) {
                  			scope.model.toggle_play(false);
                  			element[0].currentTime = scope.model.infbndsec;
                  			scope.model.toggle_play(true);
              			}

                    });
                });

				scope.$watch("model.play_state", function (newValue) {
					if (newValue) {
						scope.model.play_label = "Pause";
					} else {
						scope.model.play_label = "Play";
					}
				});
			}
		};
	}]);