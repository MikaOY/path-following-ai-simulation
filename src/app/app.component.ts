
import { Component, OnInit } from '@angular/core';
import { MlService } from './ml.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bot: any;
  // drawing path //
  flag = false;
  prevX = 0;
  currX = 0;
  prevY = 0;
  currY = 0;
  dot_flag = false;
  y = 2;
  canvasWidth: number;
  canvasHeight: number;
  currAngle: number = 0;
  // training //
  xCmd: number;
  yCmd: number;
  // working //
  pointsArray: any[] = [];
  cleanPointsArray: any[] = [];

  constructor(private mlService: MlService) { }

  ngOnInit() {

    /* path-drawing */

    this.canvas = document.getElementById('mah-canvas') as HTMLCanvasElement;
    if (this.canvas.getContext) {
      this.ctx = this.canvas.getContext('2d');

      // // rectangles
      // ctx.fillStyle = 'rgb(200, 0, 0)';
      // ctx.fillRect(10, 10, 50, 50);
      // ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      // ctx.fillRect(30, 30, 50, 50);

      // // paths
      // ctx.beginPath();
      // ctx.moveTo(200, 80);
      // ctx.lineTo(100, 75);
      // ctx.lineTo(100, 25);
      // ctx.fill();

      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;

      this.canvas.addEventListener("mousemove", (e) => {
        this.findxy('move', e)
      }, false);
      this.canvas.addEventListener("mousedown", (e) => {
        this.findxy('down', e)
      }, false);
      this.canvas.addEventListener("mouseup", (e) => {
        this.findxy('up', e)
      }, false);
      this.canvas.addEventListener("mouseout", (e) => {
        this.findxy('out', e)
      }, false);
    }

    // path doesn't close until logPoints() called
    this.ctx.beginPath();

    this.drawBot(); 
  }

  drawBot() {
    // robot
    // let img = new Image();
    // img.src = '../assets/robot50.jpg';
    // this.ctx.drawImage(img, 50, 50);
    // this.bot = this.ctx.fillRect(250, 250, 50, 50);    
    this.ctx.strokeStyle = 'black';
    this.ctx.fillStyle = 'orange';
    let startX = this.mlService.botStart.x; 
    let startY = this.mlService.botStart.y; 
    let width = this.mlService.botWidth; 

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(startX + width, startY);
    this.ctx.lineTo(startX + 10, startY - 30);
    this.ctx.moveTo(startX + 40, startY - 30);
    this.ctx.lineTo(startX + 10, startY - 30);
    this.ctx.lineTo(startX + width, startY);
    this.ctx.fill();
  }

  /* path-drawing */

  findxy(res, e) {
    if (res == 'down') {
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = e.clientX - this.canvas.offsetLeft;
      this.currY = e.clientY - this.canvas.offsetTop;

      this.flag = true;
      this.dot_flag = true;
      if (this.dot_flag) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(this.currX, this.currY, 2, 2);
        this.ctx.closePath();
        this.dot_flag = false;
      }
    }
    if (res == 'up' || res == "out") {
      this.flag = false;
    }
    if (res == 'move') {
      if (this.flag) {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.clientX - this.canvas.offsetLeft;
        this.currY = e.clientY - this.canvas.offsetTop;
        this.draw();
      }
    }
  }

  draw() {
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(this.currX, this.currY);
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = this.y;
    this.ctx.stroke();

    this.pointsArray.push({ x: this.prevX, y: this.prevY });
  }

  erase() {
    var m = confirm("Are you sure you want to clear this path?");
    if (m) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.pointsArray = [];
      this.cleanPointsArray = [];
    }

    // redraw bot
    this.drawBot();
  }

  logPoints() {
    this.ctx.closePath();

    // select only certain points that are far away enough from each other
    for (let index = 0; index < this.pointsArray.length; index++) {
      let messyPoint = this.pointsArray[index];

      // only add clean point if far enough away from previous
      if (index == 0) {
        this.cleanPointsArray.push(messyPoint);
      }
      else {
        let latestCleanPoint = this.cleanPointsArray[this.cleanPointsArray.length - 1];
        let dist = Math.sqrt(((latestCleanPoint.x - messyPoint.x) ** 2 + (latestCleanPoint.y - messyPoint.y) ** 2));

        if (dist > 30) {
          this.cleanPointsArray.push(messyPoint);
        }
      }
    }

    console.log('Points array has length ' + this.pointsArray.length);
    console.log('Cleaned points array has length ' + this.cleanPointsArray.length);

    this.cleanPointsArray.forEach(pt => {
      // draw circle at point
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'orange';
      this.ctx.fill();
    });
  }

  /* training */

  /** train ML movement model by plotting command and position change after execution as data point */
  train() {
    console.log('Training ML model');
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    let oldPos = this.getBotPos();
    this.moveBot(this.xCmd, this.yCmd);
    let newPos = this.getBotPos();

    this.mlService.train(this.xCmd, this.yCmd, oldPos, newPos);
  }

  /** get bot's current Cartesian position */
  getBotPos() {
    // get coordinates of body center
  }

  /** move + animate both wheels of bot
   * @param {number} - left wheel speed
   * @param {number} - right wheel speed
   */
  moveBot(leftSpd, rightSpd) {
    this.drawTravelPath(leftSpd, rightSpd);
    
  }

  /** draws the path each bot part will move 
   * @param {number} - number of revolutions left wheel turns in given time
   * @param {number} - number of revolutions left wheel turns in given time
   * @returns {{x,y}} - change in x and y distance
  */
  drawTravelPath(leftSpeed: number, rightSpeed: number) {
    console.log('Left speed = ' + leftSpeed + ', rightSpeed = ' + rightSpeed);

    // calculate arc/ path of left wheel, right wheel, and body based on speeds given
    let isCounterClock: boolean;
    let x, y, r, eAngle, xC, yC, slope, arciLength, currAngle: number;
    let sAngle: number = 0;
    let x2: number = 250; // pos of right bottom of rect (inner arc)
    let y2: number = 250; // pos of right bottom of rect (inner arc)

    if (leftSpeed > rightSpeed) {
      isCounterClock = false; // travel clockwise
      r = this.mlService.getRadius(leftSpeed, rightSpeed);
      // calculate inner arc length, in this case right wheel
      arciLength = rightSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else if (leftSpeed < rightSpeed) {
      isCounterClock = true; // travel counterclock
      r = this.mlService.getRadius(leftSpeed, rightSpeed);
      arciLength = leftSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else {
      // travel in straight line
      let xChange = 0;
      let yChange = leftSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;

      // draw line and rect
      this.ctx.beginPath();
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x2, y2 + yChange);
      this.ctx.fillRect(x2 - 5, y2 + yChange - 5, 10, 10);
      this.ctx.stroke();
      return [xChange, yChange];
    }
    console.log('radius of center arc = ' + r + ', isCounterClock = ' + isCounterClock);

    let ri = r - (this.mlService.botWidth / 2); // inner radius
    // slope = (this.y2 - this.y1) / (this.x2 - this.x1);
    slope = 0; // bot is not angled

    // CHANGE to the center of circle/arc from inner wheel
    xC = isCounterClock ? ri : -ri; // only for straight bots
    yC = slope * xC; // always 0 for now

    // actual x and y center coordinates
    x = xC + x2;
    y = yC + y2;
    console.log('actual center coordinates: (' + x + ', ' + y + ')');

    sAngle = isCounterClock ? Math.PI : 0; // start angle in rad
    console.log('arcilength = ' + arciLength + ', ri = ' + ri);
    eAngle = isCounterClock ? Math.PI - (arciLength / ri) : (arciLength / ri); // calc end angle in radians
    console.log('end angle = ' + eAngle + ' radians');

    // clears canvas and draws ARC
    this.currAngle = 0;
    this.animateBotAlongPath(x, y, r, sAngle, eAngle, isCounterClock);
 

    // find change in x and y from center of bot
    // start pos of bot center
    let startX = isCounterClock ? x - r : x + r; // doesn't account for non-straight bots
    let startY = y; // always same as circle center for now
    this.ctx.fillRect(startX, startY, 20, 20);
    this.ctx.fillRect(x, y, 10, 10);

    // angle from origin
    let angle = isCounterClock ? (2 * Math.PI) - eAngle : eAngle - sAngle;
    console.log('angle from origin = ' + angle);

    // end position coordinates
    let endX = x + (r * Math.cos(angle));
    let endY = isCounterClock ? y - (r * Math.sin(angle)) : y + (r * Math.sin(angle));
    console.log('endX = ' + endX + ', endY = ' + endY);
    this.ctx.fillRect(endX, endY, 20, 20);

    // subtract from start coordinates to get change
    let xChange = endX - startX;
    let yChange = (endY - startY); // negate for weird canvas system
    console.log('xChange = ' + xChange + ', yChange = ' + yChange);
    return [xChange, yChange];
  }

  /** 
   * returns radius to CENTER between wheels
   */
  getRadius(leftSpeed: number, rightSpeed: number) {
    let bigSpeed, smallSpeed, r: number;
    bigSpeed = leftSpeed > rightSpeed ? leftSpeed : rightSpeed;
    smallSpeed = leftSpeed > rightSpeed ? rightSpeed : leftSpeed;

    r = this.mlService.botWidth / (bigSpeed / smallSpeed - 1);
    r += this.mlService.botWidth / 2;
    return r;
  }

  /** animates all provided objects along provided path, starting and ending at the same time */
  animateBotAlongPath(x, y, r, sAngle, eAngle, isCounterClock) {
    // get path (stored as properties) and animate left wheel, right wheel, and body along them
    // Clear off the canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    // Start over
    this.ctx.beginPath();
    // Re-draw from the very beginning each time so there isn't tiny line spaces between each section (the browser paint rendering will probably be smoother too)
    this.ctx.arc(x, y, r, sAngle, sAngle + this.currAngle, isCounterClock);
    // Draw
    this.ctx.stroke();
    // Increment percent
    if (isCounterClock) {
      this.currAngle -= 0.1;
      if (sAngle + this.currAngle > eAngle) {
        // Recursive repeat this function until the end is reached
        window.requestAnimationFrame(() => {
          this.animateBotAlongPath(x, y, r, sAngle, eAngle, isCounterClock);
        });
      } else {
        
      }
    } else {
      this.currAngle += 0.1;
      if (sAngle + this.currAngle < eAngle) {
        // Recursive repeat this function until the end is reached
        window.requestAnimationFrame(() => {
          this.animateBotAlongPath(x, y, r, sAngle, eAngle, isCounterClock);
        });
      } else {
        
      }
    }
    // Animate until end
    
  }
}
