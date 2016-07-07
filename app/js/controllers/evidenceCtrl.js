/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$document', '$sce', '$scope', '$http',
		'defaults', '$controller', 'Session', '$rootScope', 'camomileService',

		function ($document, $sce, $scope, $http, defaults, $controller, Session, $rootScope, camomileService) {

			/*import MissPlete from './MissPlete.js';

        	new MissPlete({
            	input: document.querySelector('input[name="entry_input"]'),

            	options: [["Barcelona", "BCN"], ["San Francisco", "SF"]]
        	});*/

			$controller('CommonCtrl', {
				$scope: $scope,
				$http: $http,
				defaults: defaults,
				Session: Session
			});

			function invalidInput(){
    			var re = /^[a-z_]+[a-z]$/;
    			if(!re.test(document.getElementById('entry_input').value)) document.getElementById('message').innerHTML = "You may only use underscore <code>_</code> or unaccented lower case letters <code>a-z</code>.";
    			else document.getElementById('message').innerHTML = "";
    		}

    		$scope.model.updateValidInput = function(){
    			invalidInput();
    			var re = /^[a-z_]+[a-z]$/;
        		if(!re.test(document.getElementById('entry_input').value) || document.getElementById("Wbox").value == "") document.getElementById('confirm').disabled = "disabled";
				else document.getElementById('confirm').disabled = "";
    		}

    		$scope.model.updateLabel = function(){
        		invalidInput();
        		var re = /^[a-z_]+[a-z]$/;
        		if(!re.test(document.getElementById('entry_input').value) || document.getElementById("Wbox").value == "") document.getElementById('confirm').disabled = "disabled";
				else {
					document.getElementById('confirm').disabled = "";
				}
				if(re.test(document.getElementById('entry_input').value)) document.getElementById('label_name').innerHTML = document.getElementById('entry_input').value;
    		};

			$scope.model.incomingQueue = $rootScope.queues.evidenceIn;
			$scope.model.outgoingQueue = $rootScope.queues.evidenceOut;

			$scope.model.q = {};

			$scope.model.user_input = {};

			$scope.model.updateIsDisplayedVideo = function (activate) {
				$scope.model.isDisplayedVideo = activate;
			};

			// initialize page state
			$scope.model.updateIsDisplayedVideo(false);

			var _getVideo = function (id_medium, callback) {

				camomileService.getMedium(id_medium, function (err, medium) {
					callback(err, $sce.trustAsResourceUrl($scope.model.videoPath + '/' + medium.url + '.mp4'));
				});
			};

			// Initializes the data from the queue
			// rename from "initQueueData" to "popQueueElement"
			$scope.model.popQueueElement = function () {

				document.getElementById('videoTest1').innerHTML = "";
				document.getElementById('videoTest2').innerHTML = "";
				document.getElementById('videoTest3').innerHTML = "";
				// Get queue first element and pop it from the queue
				camomileService.dequeue($scope.model.incomingQueue, function (err, item) {


					if (err) {
						alert(item.error);
						$scope.$apply(function () {
							$scope.model.video = undefined;
							$scope.model.isDisplayedVideo = false;
							$scope.model.updateIsDisplayedVideo(false);
						});

						return;
					}

					//$scope.model.resetTransparentPlan();
					$scope.model.updateIsDisplayedVideo(true);

					if (item.modality === "pronounced") {
						document.getElementById("message").innerHTML = "WARNING: The person name might be pronounced !";
					}

					$scope.model.q = item;
					$scope.model.user_input.person_name = $scope.model.q.person_name;
					document.getElementById('label_name').innerHTML = $scope.model.q.person_name;
					$scope.model.initialData = $scope.model.q.person_name;

					// Update the add entry button's status
					$scope.model.updateIsDisplayedVideo($scope.model.user_input.person_name != "");

					async.parallel({
							video: function (callback) {
								_getVideo($scope.model.q.medium_id, callback);
							},
							serverDate: function (callback) {
								camomileService.getDate(function (err, data) {
									callback(null, data.date);
								});
							}
						},
						function (err, results) {
							$scope.model.video = results.video;
							$scope.model.serverDate = results.serverDate;
							$scope.model.clientDate = Date.now();

							$scope.model.restrict_toggle = 2;
							$scope.model.current_time_temp = $scope.model.q.t;
							$scope.model.infbndsec = parseFloat($scope.model.q.t || 0);
							$scope.model.infbndsec-=5.0;
							if ($scope.model.infbndsec < 0) {
								$scope.model.infbndsec = 0;
							}
							$scope.model.supbndsec = parseFloat($scope.model.q.t || 0);
							$scope.model.supbndsec+=5.0;
							if ($scope.model.supbndsec > $scope.model.fullDuration) {
								$scope.model.supbndsec = $scope.model.fullDuration;
							}
							$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.q.t;
							});

						});
				});
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence) {

				if (document.getElementById('evidence').src == "" && isEvidence =="yes") {
					document.getElementById("message").innerHTML = "Please draw a bounding box around the face.";
					return;
				}

				var item = {};

				item.log = {};
				item.log.user = Session.username;
				item.log.date = $scope.model.serverDate;
				item.log.duration = Date.now() - $scope.model.clientDate;
				/*camomileService.me(function(callback){
					item.log.user_id = _id;
				});*/

				item.input = {};
				item.input.corpus_id = $scope.model.q.corpus_id;
				item.input.medium_id = $scope.model.q.medium_id;
				item.input.modality = $scope.model.q.modality;
				item.input.person_name = $scope.model.initialData;
				item.input.t = $scope.model.q.t;

				var b_box = {};
				b_box.w = parseFloat(document.getElementById("Wbox").value);
				b_box.h = parseFloat(document.getElementById("Hbox").value);
				b_box.x = parseFloat(document.getElementById("Xbox").value);
				b_box.y = parseFloat(document.getElementById("Ybox").value);

				item.output = {};
				item.output.status = isEvidence;
				if (isEvidence == "yes") {
					item.output.person_name = $scope.model.user_input.person_name;
					item.output.t = $scope.model.current_time;
					item.output.image = document.getElementById('evidence').src;
					item.output.bounding_box = b_box;
				}

				document.getElementById('evidence').src = "../img/default.jpg";
				document.getElementById('draw').children[0].width = document.getElementById('draw').children[0].width;
				document.getElementById("Wbox").value = "";
				document.getElementById("Hbox").value = "";
				document.getElementById("Xbox").value = "";
				document.getElementById("Ybox").value = "";
				document.getElementById("message").innerHTML = "";

				camomileService.enqueue($scope.model.outgoingQueue, item, function (err, data) {

					if (err) {
						console.log("Something went wrong");
					} else {
						$scope.model.popQueueElement();
					}

				});
			};

			$document.on(
				"keydown",
				function (event) {
					var targetID = event.target.id;
					var button_checked = false;
					if (targetID == 'confirm' || targetID == 'cancel') {
						button_checked = true;
					}
					//enter
					if (event.keyCode == 13 && targetID != 'localServerInput') {
						//If the focus is on the check buttons, blur the focus first
						if (button_checked) {
							event.target.blur();
						}
						$scope.$apply(function () {
							if (!document.getElementById('confirm').disabled) $scope.model.saveQueueElement("yes");
						});
					}
					//space
					if (event.keyCode == 32 && targetID != "entry_input") {
						if (button_checked) {
							event.target.blur();
						}
						$scope.$apply(function () {
							$scope.model.toggle_play();
						});
					}
					//esc-> skip
					if (event.keyCode == 27) {
						$scope.$apply(function () {
							//skip
							//$scope.model.saveQueueElement(false);
						});
					}
					//Left
					if (event.keyCode == 37) {
						$scope.$apply(function () {
							if ($scope.model.current_time - 0.04 > $scope.model.infbndsec) {
								$scope.model.current_time = $scope.model.current_time - 0.04;
							} else {
								$scope.model.current_time = $scope.model.infbndsec;
							}
						});
					}
					//Right
					if (event.keyCode == 39) {
						$scope.$apply(function () {
							if ($scope.model.current_time + 0.04 < $scope.model.supbndsec) {
								$scope.model.current_time = $scope.model.current_time + 0.04;
							} else {
								$scope.model.current_time = $scope.model.supbndsec;
							}
						});
					}
					//Up
					if (event.keyCode == 38) {
						$scope.$apply(function () {
							if ($scope.model.current_time - 1 > $scope.model.infbndsec) {
								$scope.model.current_time = $scope.model.current_time - 1;
							} else {
								$scope.model.current_time = $scope.model.infbndsec;
							}
						});

					} //Down
					if (event.keyCode == 40) {
						$scope.$apply(function () {

							if ($scope.model.current_time + 1 < $scope.model.supbndsec) {
								$scope.model.current_time = $scope.model.current_time + 1;
							} else {
								$scope.model.current_time = $scope.model.supbndsec;
							}
						});
					}
				}
			);

		}
	]);
