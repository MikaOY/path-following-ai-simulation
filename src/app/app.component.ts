
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

      // let img = new Image();
      // img.src = '../assets/robot50.jpg';
      // this.ctx.drawImage(img, 50, 50);

      // robot
      this.bot = this.ctx.fillRect(250,250,50,50);

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
    this.drawTravelPath(leftSpd, rightSpd, this.calculateBodySpeed(leftSpd, rightSpd));
    this.animateObjectsAlongPath(); 
  }

  /** draws the path each bot part will move */
  drawTravelPath(leftSpeed: number, rightSpeed: number, bodySpeed: number) {
    console.log('Left speed = ' + leftSpeed + ', rightSpeed = ' + rightSpeed);
    // calculate arc/ path of left wheel, right wheel, and body based on speeds given
    let isCounterClock: boolean;
    let x, y, r, eAngle, xC, yC, slope, arciLength: number;
    let sAngle: number = 0;
    let x2: number = 250; // pos of right bottom of rect (inner arc)
    let y2: number = 250; // pos of right bottom of rect (inner arc)

    if (leftSpeed > rightSpeed) {
      isCounterClock = false; // travel clockwise
      r = this.getRadius(leftSpeed, rightSpeed);
      arciLength = rightSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else if (leftSpeed < rightSpeed) {
      isCounterClock = true; // travel counterclock
      r = this.getRadius(leftSpeed, rightSpeed);
      arciLength = leftSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else {
      // travel in straight line
    }
    console.log('radius of center arc = ' + r + ', isCounterClock = ' + isCounterClock);
    let ri = r - (this.mlService.botWidth / 2); // inner radius
    // slope = (this.y2 - this.y1) / (this.x2 - this.x1);
    slope = 0;

    // change to the center of circle/arc
    //xC = Math.sqrt((Math.pow(ri, 2) - Math.pow(slope, 2))/2);
    xC = isCounterClock ? ri : -ri;
    yC = slope * xC;

    // actual x and y center coordinates
    x = xC + x2; // TODO: + x2
    y = yC + y2; // TODO: + y2 (always 0 for now)
    console.log('actual center coordinates: (' + x + ', ' + y + ')');

    
    eAngle = arciLength / ri // calc angle in radians
    console.log('end angle = ' + eAngle + ' radians');

    let startX = x + r; // doesn't account for non-straight bots
    let startY = y; // always 0 for now

    let arcCLength = r * (Math.PI / eAngle);
    this.findChange(startX, startY, x, y, arcCLength, isCounterClock);

    this.ctx.arc(x,y,r,sAngle,eAngle,isCounterClock);
    this.ctx.stroke();

  }

  findChange(startX, startY, Cx, Cy, length, isCounterClock): number[] {
    let r = Math.sqrt(Math.pow(startX - Cx, 2) + Math.pow(startY - Cy, 2));
    let angle = Math.atan2(startY - Cy, startX - Cx);
    if (!isCounterClock) {
        angle = angle - length / r;
    }
    else {
        angle = angle + length / r;
    }
    let endX = Cx + r * Math.cos(angle);
    let endY = Cy + r * Math.sin(angle);
    
    let xChange = endX - startX;
    let yChange = endY - startY;
    console.log('xChange = ' + xChange + ', yChange = ' + yChange);
    return [xChange, yChange];
  }

  // returns radius to CENTER between wheels
  getRadius(leftSpeed: number, rightSpeed: number) {
    let bigSpeed, smallSpeed, r: number;
    bigSpeed = leftSpeed > rightSpeed ? leftSpeed : rightSpeed;
    smallSpeed = leftSpeed > rightSpeed ? rightSpeed : leftSpeed;

    r = this.mlService.botWidth / (bigSpeed/smallSpeed - 1);
    r += this.mlService.botWidth / 2;
    return r;
  }

  /** calculate speed of body given speed of left and right wheel */
  calculateBodySpeed(leftSpd: number, rightSpd: number): number {
    return Math.PI; // factory data 
  }

  /** animates all provided objects along provided path, starting and ending at the same time */
  animateObjectsAlongPath() {
    // get path (stored as properties) and animate left wheel, right wheel, and body along them
  }
}
