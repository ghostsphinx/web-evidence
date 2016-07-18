/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$document', '$sce', '$scope', '$http',
		'defaults', '$controller', 'Session', '$rootScope', 'camomileService',

		function ($document, $sce, $scope, $http, defaults, $controller, Session, $rootScope, camomileService) {

			$controller('CommonCtrl', {
				$scope: $scope,
				$http: $http,
				defaults: defaults,
				Session: Session
			});

			//Display in the interface if the name is not correctly written according to the format firstname_lastname
			function invalidInput(){
    			var re = /^[a-z_]+[a-z]$/;
    			if(!re.test(document.getElementById('entry_input').value)) document.getElementById('message').innerHTML = "You may only use underscore <code>_</code> or unaccented lower case letters <code>a-z</code>.";
    			else document.getElementById('message').innerHTML = "";
    		}

    		//Enabled or not the validation button according to the input name
    		$scope.model.updateValidInput = function(){
    			invalidInput();
    			var re = /^[a-z_]+[a-z]$/;
        		if(!re.test(document.getElementById('entry_input').value) || document.getElementById("Wbox").value == "") document.getElementById('confirm').disabled = "disabled";
				else document.getElementById('confirm').disabled = "";
    		}

    		//Change the field "preview name" above the preview image according to the input
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

				//Clear the server test to prevent multiple videos read at the same time
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

					//Warn the user if the name is pronounced
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
						//Prepare the bounds and the current position of the video
						function (err, results) {
							$scope.model.video = results.video;
							$scope.model.serverDate = results.serverDate;
							$scope.model.clientDate = Date.now();

							$scope.model.infbndsec = parseFloat($scope.model.q.t-5.0 || 0);
							$scope.model.supbndsec = parseFloat($scope.model.q.t+5.0 || 0);

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.q.t;
							});

						});
				});
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence) {

				//Warn the user that he needs a bounding box to validate an evidence
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

				//Reset the elements for the next annotation
				document.getElementById('evidence').src = "../img/default.jpg";
				document.getElementById('draw').children[0].width = document.getElementById('draw').children[0].width;
				document.getElementById("Wbox").value = "";
				document.getElementById("Hbox").value = "";
				document.getElementById("Xbox").value = "";
				document.getElementById("Ybox").value = "";
				document.getElementById("message").innerHTML = "";
				document.getElementById('confirm').disabled = "disabled";
				document.getElementById('confirm').blur();
                document.getElementById('btnnk').blur();
                document.getElementById('btnno').blur();
                document.getElementById('btndk').blur();
                $scope.model.play_label = "Play";
                document.getElementById('player').src = "";

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
					//Left
					if (event.keyCode == 37) {
						$scope.$apply(function () {
							if (document.getElementById('player').currentTime - 0.04 > $scope.model.infbndsec && targetID != "entry_input") {
								document.getElementById('player').currentTime = document.getElementById('player').currentTime - 0.04;
							} else {
								document.getElementById('player').currentTime = $scope.model.infbndsec;
							}
						});
					}
					//Right
					if (event.keyCode == 39) {
						$scope.$apply(function () {
							if (document.getElementById('player').currentTime + 0.04 < $scope.model.supbndsec && targetID != "entry_input") {
								document.getElementById('player').currentTime = document.getElementById('player').currentTime + 0.04;
							} else {
								document.getElementById('player').currentTime = $scope.model.supbndsec;
							}
						});
					}
					//Up
					if (event.keyCode == 38) {
						$scope.$apply(function () {
							if (document.getElementById('player').currentTime - 1 > $scope.model.infbndsec && targetID != "entry_input") {
								document.getElementById('player').currentTime = document.getElementById('player').currentTime - 1;
							} else {
								document.getElementById('player').currentTime = $scope.model.infbndsec;
							}
						});

					} //Down
					if (event.keyCode == 40) {
						$scope.$apply(function () {

							if (document.getElementById('player').currentTime + 1 < $scope.model.supbndsec && targetID != "entry_input") {
								document.getElementById('player').currentTime = document.getElementById('player').currentTime + 1;
							} else {
								document.getElementById('player').currentTime = $scope.model.supbndsec;
							}
						});
					}
				}
			);

			$document.on(
				"keydown",
				function (event) {
					var targetID = event.target.id;
					//space
					if (event.keyCode == 32 && targetID != "entry_input") {
						$scope.$apply(function () {
							$scope.model.toggle_play();
						});
					}
				}
			);

		}
	]);
