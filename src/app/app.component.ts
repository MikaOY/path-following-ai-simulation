
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
  currAnglePercent: number = 0; // number added/subtracted for animation purposes
  startAngle: number = 0; // clockwise angle from origin to start 
  currLinePercent: number = 0; // percent animated
  // training //
  leftCmd: number;
  rightCmd: number;
  formBotAngle: number;
  public autoTrainProgress: number = 0;
  // working //
  pointsArray: { x: number, y: number }[] = [];
  cleanPointsArray: { x: number, y: number }[] = [];
  endpointsArray: { x: number, y: number }[] = [];
  specialArray: { x: number, y: number }[] = [];
  storedInputs; 
  // store previously drawn shapes
  // lines are stored with x and y as the start points and radius and startAngle as the end points
  pathsArray: {
    isArc: boolean, x: number, y: number, r: number, startAngle: number,
    endAngle: number, isCounterClock: boolean
  }[] = [];
  currentFollowStep: number = -1;
  displayFollowWarning: boolean = false;

  constructor(public mlService: MlService) { }

  ngOnInit() {

    /* path-drawing */

    this.canvas = document.getElementById('mah-canvas') as HTMLCanvasElement;
    if (this.canvas.getContext) {
      this.ctx = this.canvas.getContext('2d');

      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;

      this.canvas.addEventListener('mousemove', (e) => {
        this.findxy('move', e)
      }, false);
      this.canvas.addEventListener('mousedown', (e) => {
        this.findxy('down', e)
      }, false);
      this.canvas.addEventListener('mouseup', (e) => {
        this.findxy('up', e)
      }, false);
      this.canvas.addEventListener('mouseout', (e) => {
        this.findxy('out', e)
      }, false);
    }

    // path doesn't close until logPoints() called
    this.ctx.beginPath();

    this.drawBot(0, this.mlService.CONST_BOT_CENTER.x, this.mlService.CONST_BOT_CENTER.y);
  }

  /**
   * Draws bot with center x, y
   * @param clockAngle
   * @param x 
   * @param y 
   */
  drawBot(clockAngle: number, x?: number, y?: number) {
    // set origin to bot center and rotate
    this.ctx.translate(x, y);
    this.ctx.rotate(clockAngle);

    this.ctx.strokeStyle = 'black';
    this.ctx.fillStyle = 'orange';
    let width = this.mlService.botWidth;
    let height = this.mlService.botHeight;
    let startX = 0 - width / 2; // offset to make it at center
    let startY = 0 + height / 2;

    // draw bot
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(startX + width, startY);
    this.ctx.lineTo(startX + 10, startY - (height - 10));
    this.ctx.moveTo(startX + 40, startY - (height - 10));
    this.ctx.lineTo(startX + 10, startY - (height - 10));
    this.ctx.lineTo(startX + width, startY);
    this.ctx.fill();
    this.ctx.closePath();

    // reset transform matrix
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* path-drawing */

  findxy(res, e) {
    if (res == 'down') {
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = e.pageX - this.canvas.offsetLeft;
      this.currY = e.pageY - this.canvas.offsetTop;

      this.flag = true;
      this.dot_flag = true;
      if (this.dot_flag) {
        this.ctx.beginPath();
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.currX, this.currY, 2, 2);
        this.ctx.closePath();
        this.dot_flag = false;
      }
    }
    if (res == 'up' || res == 'out') {
      this.flag = false;
    }
    if (res == 'move') {
      if (this.flag) {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.pageX - this.canvas.offsetLeft;
        this.currY = e.pageY - this.canvas.offsetTop;
        this.draw();
      }
    }
  }

  draw() {
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(this.currX, this.currY);
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = this.y;
    this.ctx.stroke();

    this.pointsArray.push({ x: this.prevX, y: this.prevY });
  }

  reset(skip?: boolean, angle?: number, skipPaths?: boolean) {
    let m;
    if (!skip) {
      m = confirm('Are you sure you want to reset the robot and clear all paths?');
    }
    if (m || skip) {
      this.pointsArray = [];
      this.cleanPointsArray = [];


      this.startAngle = 0;
      this.currAnglePercent = 0;
      this.currentFollowStep = -1;
      this.mlService.resetBot(angle);

      if (!skipPaths) {
         this.pathsArray = [];
         this.specialArray = [];
         this.endpointsArray = [];
         console.log('paths array emptied');
      }
      // reset visuals
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.drawBot(0, this.mlService.CONST_BOT_CENTER.x, this.mlService.CONST_BOT_CENTER.y);
    }
  }

  calculateCleanPoints(doDraw?: boolean) {
    this.ctx.closePath();

    // select only certain points that are far away enough from each other
    for (let index = 0; index < this.pointsArray.length; index++) {
      let messyPoint = this.pointsArray[index];

      // only add clean point if far enough away from previous
      if (index == 0) {
        // do not add duplicates
        if (!this.cleanPointsArray.find((pt, i, a) => pt.x == messyPoint.x && pt.y == messyPoint.y)) {
          this.cleanPointsArray.push(messyPoint);
        }
      }
      else {
        let latestCleanPoint = this.cleanPointsArray[this.cleanPointsArray.length - 1];
        let dist = Math.sqrt(((latestCleanPoint.x - messyPoint.x) ** 2 + (latestCleanPoint.y - messyPoint.y) ** 2));

        if (dist > 40) {
          // do not add duplicates
          if (!this.cleanPointsArray.find((pt, i, a) => pt.x == messyPoint.x && pt.y == messyPoint.y)) {
            this.cleanPointsArray.push(messyPoint);
          }
        }
      }
    }

    console.log('Points array has length ' + this.pointsArray.length);
    console.log('Cleaned points array has length ' + this.cleanPointsArray.length);

    // draw clean points if doDraw undefined or true
    if (doDraw == undefined || doDraw == true) {
      this.cleanPointsArray.forEach(pt => {
        // draw circle at point
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'orange';
        this.ctx.fill();
      });
    }
  }

  /* training */

  /** train ML movement model by plotting command and position change after execution as data point */
  train() {
    console.log('TRAINING ML MODEL');

    // get initial and final bot position
    let oldPos = this.getBotPos();
    if (this.formBotAngle != undefined) {
      this.reset(true, this.formBotAngle * Math.PI);
    }
    let startAngle = this.mlService.botAngle;
    let translation: number[] = this.moveBot(this.leftCmd, this.rightCmd);
    let newPos: number[] = [oldPos[0] + translation[0], oldPos[1] + translation[1]];
    this.mlService.recordData(this.leftCmd, this.rightCmd, oldPos, newPos, startAngle);

    this.displayFollowWarning = false;
  }

  autoTrainAsync() {
    return this.autoTrainActual();
  }

  /** train with many auto generated points */
  autoTrainActual(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('AUTO TRAINING INITIATED');

      // generate commands to train
      let increment: number = 0.2;
      let lowerRange: number = 0;
      let upperRange: number = 3;
      let commands: number[][] = [];
      let angleArray: number[] = [];
      for (var i = 0; i <= (Math.PI / 2); i += (Math.PI / 30)) {
        angleArray.push(i);
      }
      angleArray.forEach(angle => {
        // CANNOT have for loop here because it causes jams
        let array: number[] = []; // generate nums 0.4, 0.8, 1.2, etc
        for (var index = increment; index < upperRange + increment; index += increment) { array.push(this.round(index, 2)); }

        array.forEach(num => {
          // increment x and y
          for (var j = increment; j < upperRange + increment; j += increment) {
            commands.push([this.round(j, 2), this.round(num, 2), angle]);
          }
        });
      });

      // train on each command
      commands.forEach(cmd => {
        // update progress visuals
        let index = commands.indexOf(cmd);
        this.autoTrainProgress = index / commands.length * 100;

        // get initial and final bot position
        let oldPos = this.getBotPos();
        // reset bot
        this.mlService.resetBot(cmd[2]);
        if (this.mlService.botAngle != cmd[2]) {
          console.error('BBEEEP BEEEP ANGLES NOT RIGHT');
        }
        let translation: number[] = this.moveBot(cmd[0], cmd[1], true);
        let newPos: number[] = [oldPos[0] + translation[0], oldPos[1] + translation[1]];
        this.mlService.recordData(cmd[0], cmd[1], oldPos, newPos, cmd[2]);
      });

      // reset visuals
      this.autoTrainProgress = 0;
      // this.mlService.outputCommands.forEach(change => {
      //   console.log('AUTO TRAIN: an output ' + change.toString());
      // });
     
      this.reset(true, undefined, true);
      this.drawStoredPaths();
      resolve(null);
    });
  }

  round(value: number, precision: number) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  /** get bot's current Cartesian position */
  getBotPos(): number[] {
    // get coordinates of body center
    return [this.mlService.botCenter.x, this.mlService.botCenter.y];
  }

  /** move + animate both wheels of bot
   * @param {number} - left wheel speed
   * @param {number} - right wheel speed
   */
  moveBot(leftSpd: number, rightSpd: number, skipAni?: boolean): number[] {
    return this.drawTravelPath(leftSpd, rightSpd, skipAni);
  }

  /** draws the path each bot part will move 
   * @param {number} - number of revolutions left wheel turns in given time
   * @param {number} - number of revolutions left wheel turns in given time
   * @returns {{x,y}} - change in x and y distance
  */
  drawTravelPath(leftSpeed: number, rightSpeed: number, skipAni?: boolean): number[] {
    // calculate arc / path of body based on speeds given //
    let isCounterClock: boolean;
    let centerX, centerY, r, endAngle, innerArcLength, currAngle: number;
    let initialAngle = this.mlService.botAngle;

    // 1 - determine direction of turn if turning; else simply draw straight path
    if (leftSpeed > rightSpeed) {
      isCounterClock = false;
      innerArcLength = rightSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else if (leftSpeed < rightSpeed) {
      isCounterClock = true;
      innerArcLength = leftSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
    } else {
      // travel in straight line
      let d: number = leftSpeed * (this.mlService.wheelRadius * 2 * Math.PI) * this.mlService.timeUnit;
      let xChange = d * Math.cos(this.mlService.botAngle);
      let yChange = -(d * Math.sin(this.mlService.botAngle)); // negated because y positive is down
      if (!skipAni) {
        this.animateBotAlongLine(this.mlService.botCenter.x, this.mlService.botCenter.y,
          xChange, yChange);
      } else { // training store path
        let endX = this.mlService.botCenter.x + xChange;
        let endY = this.mlService.botCenter.y + yChange;
        if (this.mlService.botAngle == Math.PI/2){
          this.pathsArray.push({
            isArc: false, x: this.mlService.botCenter.x, y: this.mlService.botCenter.y, r: endX, startAngle: endY,
            endAngle: undefined, isCounterClock: undefined
          });
          this.specialArray.push({ x: endX, y: endY });
        } else {
          this.endpointsArray.push({ x: endX, y: endY });
        }
      }

      // update bot center
      this.mlService.botCenter.y += yChange;
      this.mlService.botCenter.x += xChange;

      return [xChange, yChange];
    }
    // console.log('ANI: isCounterCLockwise = ' + isCounterClock);

    // 2 - find center of arc path
    r = this.mlService.getRadius(leftSpeed, rightSpeed);
    let innerR = r - (this.mlService.botWidth / 2);
    // console.log('ANI: inner arc length = ' + innerArcLength + ', inner arc radius = ' + innerR);

    // difference to bot center to center
    let arcCenterPolarAngleDiff = isCounterClock ? (this.mlService.botAngle + Math.PI / 2) : (this.mlService.botAngle - Math.PI / 2);
    let botToArcCenterDiffX = (r * Math.cos(arcCenterPolarAngleDiff));
    let botToArcCenterDiffY = -(r * Math.sin(arcCenterPolarAngleDiff));
    // console.log('ANI: arcCenterPolarAngleDiff = ' + arcCenterPolarAngleDiff);
    // console.log('ANI: starting botCenter = (' + this.mlService.botCenter.x + ', ' + this.mlService.botCenter.y + ')');
    centerX = botToArcCenterDiffX + this.mlService.botCenter.x;
    centerY = botToArcCenterDiffY + this.mlService.botCenter.y;
    // console.log('ANI: arc center coordinates: (' + centerX + ', ' + centerY + ')');

    // 3 - find start and end angle
    this.startAngle = (2 * Math.PI) - (isCounterClock ? (this.mlService.botAngle - Math.PI / 2) : (this.mlService.botAngle + Math.PI / 2));
    endAngle = (isCounterClock ? this.startAngle - (innerArcLength / innerR) : this.startAngle + (innerArcLength / innerR));
    // console.log('ANI: start angle = ' + this.startAngle + ' radians, end angle = ' + endAngle + ' radians');

    // find translation caused by motor movement //

    // find start pos of bot (center)
    let startX = this.mlService.botCenter.x;
    let startY = this.mlService.botCenter.y;

    // find angle from origin
    let angle = (2 * Math.PI) - endAngle;
    // console.log('ANI: counterclockwise angle from origin = ' + angle);
    // set botAngle depending on direction facing
    this.mlService.botAngle = isCounterClock ? angle + (Math.PI / 2) : angle - (Math.PI / 2);
    // console.log('ANI: botAngle = ' + this.mlService.botAngle);

    // end position coordinates
    let endX = centerX + (r * Math.cos(angle));
    let endY = isCounterClock ? centerY - (r * Math.sin(angle)) : centerY - (r * Math.sin(angle));
    //console.log('ANI: endingX = ' + endX + ', endingY = ' + endY);
    this.ctx.fillRect(endX, endY, 20, 20);

    // subtract from start coordinates to get change
    let xChange = endX - startX;
    let yChange = (endY - startY);
    //console.log('ANI: xChange = ' + xChange + ', yChange = ' + yChange);
    // update bot center 
    this.mlService.botCenter.x += xChange;
    this.mlService.botCenter.y += yChange;

    // clear canvas and draw movement path //
    let startPos: { x: number, y: number } = { x: startX, y: startY };
    let endPos: { x: number, y: number } = { x: endX, y: endY };
    this.currAnglePercent = 0;
    if (skipAni) {
      if (initialAngle == Math.PI / 2) {
        this.pathsArray.push({
            isArc: true, x: centerX, y: centerY, r: r, startAngle: this.startAngle,
            endAngle: endAngle, isCounterClock: isCounterClock
          });
          this.specialArray.push({ x: endX, y: endY });
      } else {
        this.endpointsArray.push({ x: endX, y: endY });
      }
    } else {
      this.animateBotAlongPath(centerX, centerY, r, this.startAngle, endAngle, isCounterClock, startPos, endPos);
    }

    console.log('ANI: pos change (' + xChange + ', ' + yChange + ')');
    return [xChange, yChange];
  }

  drawStoredPaths() {
    this.pathsArray.forEach((path) => {
      if (path.isArc) { // draw arc
        this.ctx.beginPath();
        this.ctx.arc(path.x, path.y, path.r, path.startAngle, path.endAngle, path.isCounterClock);
        this.ctx.strokeStyle = 'red';
        this.ctx.stroke();
      } else { // draw line
        this.ctx.beginPath();
        this.ctx.moveTo(path.x, path.y);
        // for lines, r = endX and startAngle = endY
        this.ctx.lineTo(path.r, path.startAngle);
        this.ctx.stroke();
      }
    });

    // redraw normal + clean points
    for (var index = 0; index < this.pointsArray.length; index++) {
      var pt = this.pointsArray[index];
      if (index == 0) {
        this.ctx.moveTo(pt.x, pt.y);
      } else {
        this.ctx.lineTo(pt.x, pt.y);
        this.ctx.moveTo(pt.x, pt.y);
        this.ctx.lineWidth = this.y;
        this.ctx.strokeStyle = 'black';
        this.ctx.stroke();
      }
    }

    // draw clean points
    this.cleanPointsArray.forEach(pt => {
      // draw circle at point
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'orange';
      this.ctx.fill();
    });

    // draw end points
    this.endpointsArray.forEach(pt => {
      // draw circle at point
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'blue';
      this.ctx.fill();
    });

    // draw special points
    this.specialArray.forEach(pt => {
      // draw circle at point
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'orange';
      this.ctx.fill();
    });
    
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

  animateBotAlongLine(startX, startY, changeX, changeY) {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawStoredPaths();

    // draw line 
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(startX + (changeX * this.currLinePercent), startY + (changeY * this.currLinePercent));
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
    this.currLinePercent += 0.04; // controls speed
    // keep looping until 100%
    if (this.currLinePercent < 1) {
      window.requestAnimationFrame(() => {
        this.animateBotAlongLine(startX, startY, changeX, changeY);
      });
    } else { // end the animation when done
      let startPos = { x: startX, y: startY };
      let endPos = { x: startX + changeX, y: startY + changeY };
      this.endAnimation((Math.PI / 2) - this.mlService.botAngle, startPos, endPos);
      // store line
      this.pathsArray.push({
        isArc: false, x: startPos.x, y: startPos.y,
        r: endPos.x, startAngle: endPos.y, endAngle: undefined, isCounterClock: undefined
      });
      this.currLinePercent = 0;
    }
  }

  /** animates all provided objects along provided path, starting and ending at the same time */
  animateBotAlongPath(x, y, r, startAngle, endAngle, isCounterClock, startPos, endPos) {
    // get path (stored as properties) and animate left wheel, right wheel, and body along them
    // Clear off the canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawStoredPaths();
    // Start over
    this.ctx.beginPath();
    // calculate angle difference based on percentage
    let drawToAngle = (endAngle - startAngle) * this.currAnglePercent;
    // Re-draw from the very beginning each time so there isn't tiny line spaces between each section 
    this.ctx.arc(x, y, r, startAngle, startAngle + drawToAngle, isCounterClock);
    // Draw
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
    // Increment percent
    if (isCounterClock) {
      this.currAnglePercent += 0.04;
      if (startAngle + drawToAngle > endAngle) {
        // Recursive repeat this function until the end is reached
        window.requestAnimationFrame(() => {
          this.animateBotAlongPath(x, y, r, startAngle, endAngle, isCounterClock, startPos, endPos);
        });
      } else {
        // store in array
        this.pathsArray.push({
          isArc: true, x: x, y: y, r: r, startAngle: startAngle,
          endAngle: endAngle, isCounterClock: isCounterClock
        });
        // draw bot when finished
        this.endAnimation(endAngle, startPos, endPos, x, y);
      }
    } else {
      this.currAnglePercent += 0.04;
      if (startAngle + drawToAngle < endAngle) {
        // Recursive repeat this function until the end is reached
        window.requestAnimationFrame(() => {
          this.animateBotAlongPath(x, y, r, startAngle, endAngle, isCounterClock, startPos, endPos);
        });
      } else {
        // store in array
        this.pathsArray.push({
          isArc: true, x: x, y: y, r: r, startAngle: startAngle,
          endAngle: endAngle, isCounterClock: isCounterClock
        });
        // flip bot in other direction :}
        this.endAnimation(endAngle - Math.PI, startPos, endPos, x, y);
      }
    }
  }

  endAnimation(endAngle, startPos, endPos, x?, y?) {
    // draw ref points
    // bot start point
    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.strokeStyle = 'black';
    this.ctx.arc(startPos.x, startPos.y, 10, 0, 2 * Math.PI);
    this.ctx.fill();
    // bot end point
    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.strokeStyle = 'black';
    this.ctx.arc(endPos.x, endPos.y, 10, 0, 2 * Math.PI);
    this.ctx.fill();

    // center of path if arc
    if (x != undefined) {
      this.ctx.beginPath();
      this.ctx.fillStyle = 'green';
      this.ctx.strokeStyle = 'black';
      this.ctx.arc(x, y, 15, 0, 1.2 * Math.PI);
      this.ctx.fill();
      this.ctx.closePath();
    }

    // draw the bot
    this.drawBot(endAngle, endPos.x, endPos.y);
  }

  /* work */

  /** moves bot along path, using ML predictions; incrementally */
  followPath() {
    if (this.mlService.inputPositionChanges.length == 0 || this.mlService.outputCommands.length == 0 || this.pointsArray.length == 0) {
      this.displayFollowWarning = true;
    } else {
      this.displayFollowWarning = false;

      // train model before following
      if (this.currentFollowStep < 0) {
        if (this.cleanPointsArray.length <= 0) {
          this.calculateCleanPoints();
        }
        if (!this.mlService.model || this.storedInputs != this.mlService.inputPositionChanges) {
          this.storedInputs = this.mlService.inputPositionChanges; 
          this.mlService.trainModel();
        }
        this.currentFollowStep = 0;
      }
      if (this.currentFollowStep >= 0) {
        // get point based on slowly incremented index, predict motor commands to get there, then execute
        let currentPoint = this.cleanPointsArray[this.currentFollowStep];

        let diff: number[] = this.mlService.calculatePosDifference(this.getBotPos(), [currentPoint.x, currentPoint.y]);
        console.log('PATH: Point difference: (' + diff[0] + ', ' + diff[1] + ')');
        console.log('PATH: Current angle: (' + this.mlService.botAngle + ')');
        let cmd: number[][] = this.mlService.predictCmd(diff[0], diff[1], this.mlService.botAngle);
        console.log('PATH: Predicted motor commands: (' + cmd[0][0] + ', ' + cmd[0][1] + ')');
        this.moveBot(cmd[0][0], cmd[0][1]);
        console.log('FOLLOW: bot angle AFTER step ' + this.mlService.botAngle);
      }
    }
  }

  /** moves bot to specific point in path */
  followPoint(step: number) {
    if (step) this.currentFollowStep = step;
    else console.error('Undefined step to follow!');
    console.log('FOLLOW: bot angle before step ' + this.mlService.botAngle);
    this.followPath();
  }
}
