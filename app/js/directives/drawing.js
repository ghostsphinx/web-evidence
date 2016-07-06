/**
 * Created by xtrimolet on 06/07/16.
 */

angular.module('myApp.directives').directive('drawing', function(){
  return {
    restrict: 'E',
    scope: { localRectangles: '=rectangleList' },
    template: '<canvas class="drawing"></canvas>',
    link: function(scope, element){
    	// There are 3 canvas, one used to determine the zone to copy
    	// another one to extract the image and clip it, the last one to resize the image
      var canvasElement = element.children()[0];
      var ctx = canvasElement.getContext('2d');
      var canvasB = document.getElementById("recup");
      var ctxb = canvasB.getContext('2d');
      var canvasE = document.getElementById("evid");
      var ctxe = canvasE.getContext('2d');

      // The first canvas can be sized at the beginning
      canvasElement.width = document.getElementById("video-container").offsetWidth;
      canvasElement.height = document.getElementById("video-container").offsetHeight;

      // Are we drawing?
      var drawing = false;
      
      // the last coordinates before the current move
      var centerX;
      var centerY;

      element.children()[0].addEventListener('mousedown', function(event){ 
        reset();
        startX = event.offsetX;
        startY = event.offsetY;
        document.getElementById("player").pause();
        
        // begins new line
        ctx.beginPath();
        
        drawing = true;
      },false);

	  element.children()[0].addEventListener('mousemove', function(event){
        
        if(drawing){
        
        //document.getElementById('evid').style.display = "none";
        document.getElementById('evidenceImages').style.display = "none";

          // get current mouse position
          currentX = event.offsetX;
          currentY = event.offsetY;


          if((startX<currentX && startY<currentY) || (startX>currentX && startY>currentY)){
          	if(Math.abs(currentY-startY)<Math.abs(currentX-startX)) currentX = currentY-startY+startX;
          	else currentY = currentX-startX+startY;
          }
          else{
          	if(Math.abs(currentY-startY)<Math.abs(currentX-startX)) currentX = startY-currentY+startX;
          	else currentY = startX-currentX+startY;
    	  }

          // limit all the rectangle within the canvas and draw
          if(currentX >= 0 && currentX <= 360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight && currentY >= 0 && currentY <= 360){
            draw(startX, startY, currentX, currentY);
          }
        }
        
      },false);

      // canvas reset
      function reset(){
      	// This simple operation reset the canvas
       canvasElement.width = canvasElement.width;
       canvasB.width = canvasB.width;
       canvasE.width = canvasE.width;
      }

      element.children()[0].addEventListener('mouseup', function(event){
        // stop drawing
        drawing = false;
        //document.getElementById('evid').style.display = "";
        document.getElementById('evidenceImages').style.display = "inline-block";
      },false);
      
      function draw(startX, startY,
                    currentX, currentY, rotate){
        
        reset();
        var sizeX = currentX - startX;
        var sizeY = currentY - startY;
       
        ctx.rect(Math.min(startX,currentX),
                 Math.min(startY,currentY),
                 Math.abs(sizeX), Math.abs(sizeY));
        ctx.lineWidth = 3;
        // color gradient
        /*var gradient=ctx.createLinearGradient(Math.min(oppositeX,currentX),Math.min(oppositeY,currentY),Math.max(oppositeX,currentX),Math.max(oppositeY,currentY));
        gradient.addColorStop("0.05","red");
        gradient.addColorStop("0.15","blue");
        gradient.addColorStop("0.25","red");
        gradient.addColorStop("0.35","blue");
        gradient.addColorStop("0.45","red");
        gradient.addColorStop("0.55","blue");
        gradient.addColorStop("0.65","red");
        gradient.addColorStop("0.75","blue");
        gradient.addColorStop("0.85","red");
        gradient.addColorStop("0.95","blue");
        ctx.strokeStyle = gradient;*/
        // color
        ctx.strokeStyle = 'red';
        // draw it
        ctx.stroke();
        // Launch the copy process
        copy(Math.min(startX,currentX),Math.min(startY,currentY),Math.abs(sizeX),Math.abs(sizeY));
        document.getElementById("Xbox").value = Math.min(startX,currentX)/(360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight);
        document.getElementById("Ybox").value = Math.min(startY,currentY)/360;
        document.getElementById("Wbox").value = Math.abs(sizeX)/(360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight);
        document.getElementById("Hbox").value = Math.abs(sizeY)/360;
      }

      function copy(X, Y, sizeX, sizeY){

      	// Get the video source and size the second canvas according to the dimension (16:9 or 4:3)
        var src = document.getElementById('player');
        canvasB.width = 360*src.videoWidth/src.videoHeight;
        canvasB.height = 360;
        // Copy the image
        ctxb.drawImage(src,0,0,canvasB.width,canvasB.height);
        // Clip the image
        var btmp = ctxb.getImageData(X, Y, sizeX, sizeY);
        // Clear the second canvas to put the part of the image we want
        ctxb.clearRect(0,0,canvasB.width,canvasB.height);
        ctxb.putImageData(btmp,0,0);
        // Size of the last canvas
        canvasE.width = sizeX;
        canvasE.height = sizeY;
        // Copy from the second canvas to the third
        ctxe.putImageData(btmp,0,0);
        //dataURI JPEG output
        document.getElementById('evidence').src = canvasE.toDataURL("image/png", 1.0);
      }

      document.getElementById('player').addEventListener("pause", function() {
          var ratio = 360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight;
          copy(document.getElementById("Xbox").value*ratio,document.getElementById("Ybox").value*360,document.getElementById("Wbox").value*ratio,document.getElementById("Hbox").value*360);
      });
    }
  };
});