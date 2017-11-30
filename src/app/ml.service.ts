
import { Injectable } from '@angular/core';
import MLR from 'ml-regression-multivariate-linear';

@Injectable()
export class MlService {

  // simulated constants
  public wheelRadius: number = (50 / Math.PI); // ~1.6, circumference 10
  public botWidth: number = 50 // width between wheels in px 
  public botHeight: number = 40
  public CONST_BOT_START: { x: number, y: number } = { x: 275, y: 300 };
  public CONST_BOT_CENTER: { x: number, y: number } = { x: this.CONST_BOT_START.x + (this.botWidth / 2), y: this.CONST_BOT_START.y - (this.botHeight / 2) };
  public CONST_BOT_ANGLE = Math.PI / 2;
  private _botAngle = this.CONST_BOT_ANGLE; // direction bot is facing in, counterclock from origin
  get botAngle(): number {
    return this._botAngle;
  }
  set botAngle(newAngle: number) {
    // simplify angles
    while (newAngle > (Math.PI * 2)) {
      newAngle -= (Math.PI * 2);
    }
    this._botAngle = newAngle; 
  }
  public botCenter: { x: number, y: number } = this.CONST_BOT_CENTER;
  public timeUnit: number = 1 // number of seconds wheel rotation takes to complete 

  // service properties
  private regressionModel;
  public inputPositionChanges: number[][] = [];
  public outputCommands: number[][] = [];

  constructor() { }

  /** train ML model with user-given commands */
  train(leftCmd: number, rightCmd: number, pos: number[], newPos: number[], angle: number) {
    if (!(pos && newPos && leftCmd && rightCmd)) {
      console.log('ML: old position = ' + pos);
      console.log('ML: new position = ' + newPos);
      console.log('ML: left command = ' + leftCmd);
      console.log('ML: right command = ' + rightCmd);
      console.error('Not enough defined params to train model!');
    } else {
      let diff: number[] = this.calculatePosDifference(pos, newPos);
      this.record(leftCmd, rightCmd, diff[0], diff[1], angle);

      // train the model on training data
      this.regressionModel = new MLR(this.inputPositionChanges, this.outputCommands);
      console.log('ML: Latest regression model = ' + this.regressionModel);
      // TODO: remove logs below      
      console.log('ML: Prediction with pos change [100,200, Pi] is ' + this.regressionModel.predict([[100, 200, Math.PI]]).toString());
    }
  }

  /** record command and result of executing it as ML training data */
  record(leftCmd, rightCmd, xChange, yChange, angle) {
    // plot left + right command, pos change X + Y as one point in ML training data
    this.inputPositionChanges.push([xChange, yChange, angle]);
    console.log('ML: Recording input = ' + '[ ' + xChange + ', ' + yChange + ', ' + angle + ' ]');
    this.outputCommands.push([leftCmd, rightCmd]);
    console.log('ML: Recording output = ' + '[ ' + leftCmd + ', ' + rightCmd + ' ]');
  }

  /**
   * Calculates difference in Cartesian positions
   * @param {number[]} position1
   * @param {number[]} position2 
   * @returns {[x, y]} - change in Cartesian position, given as a 1D array with x and y component of translation
   */
  calculatePosDifference(pos1: number[], pos2: number[]) {
    return [pos2[0] - pos1[0], pos2[1] - pos1[1]];
  }

  /**
   * Calculates Cartesian translation of bot given left and right motor speed
   * @param {number} leftSpeed
   * @param {number} rightSpeed 
   * @returns {[x, y]} - change in Cartesian position, given as a 1D array with x and y component of translation
   */
  executeMotorCmd(leftSpeed: number, rightSpeed: number): number[] {
    let isCounterClock: boolean;
    let x, y, r, eAngle, xC, yC, slope, arciLength, currAngle: number;
    let sAngle: number = 0;
    let x2: number = 250; // pos of right bottom of rect (inner arc)
    let y2: number = 250; // pos of right bottom of rect (inner arc)

    if (leftSpeed > rightSpeed) {
      isCounterClock = false; // travel clockwise
      r = this.getRadius(leftSpeed, rightSpeed);
      // calculate inner arc length, in this case right wheel
      arciLength = rightSpeed * (this.wheelRadius * 2 * Math.PI) * this.timeUnit;
    } else if (leftSpeed < rightSpeed) {
      isCounterClock = true; // travel counterclock
      r = this.getRadius(leftSpeed, rightSpeed);
      arciLength = leftSpeed * (this.wheelRadius * 2 * Math.PI) * this.timeUnit;
    } else {
      // travel in straight line
      let xChange = 0;
      let yChange = leftSpeed * (this.wheelRadius * 2 * Math.PI) * this.timeUnit;

      return [xChange, yChange];
    }

    let ri = r - (this.botWidth / 2); // inner radius
    // slope = (this.y2 - this.y1) / (this.x2 - this.x1);
    slope = 0; // bot is not angled

    // CHANGE to the center of circle/arc from inner wheel
    xC = isCounterClock ? ri : -ri; // only for straight bots
    yC = slope * xC; // always 0 for now

    // actual x and y center coordinates
    x = xC + x2;
    y = yC + y2;

    sAngle = isCounterClock ? Math.PI : 0; // start angle in rad
    eAngle = isCounterClock ? Math.PI - (arciLength / ri) : (arciLength / ri); // calc end angle in radians

    // find change in x and y from center of bot
    // start pos of bot center
    let startX = isCounterClock ? x - r : x + r; // doesn't account for non-straight bots
    let startY = y; // always same as circle center for now

    // angle from origin
    let angle = isCounterClock ? (2 * Math.PI) - eAngle : eAngle - sAngle;

    // end position coordinates
    let endX = x + (r * Math.cos(angle));
    let endY = isCounterClock ? y - (r * Math.sin(angle)) : y + (r * Math.sin(angle));

    // subtract from start coordinates to get change
    let xChange = endX - startX;
    let yChange = (endY - startY); // negate for weird canvas system
    console.log('ML: Left speed = ' + leftSpeed + ', rightSpeed = ' + rightSpeed + ', xChange = ' + xChange + ', yChange = ' + yChange);
    return [xChange, yChange];
  }

  /** 
   * returns radius to CENTER between wheels
   */
  getRadius(leftSpeed: number, rightSpeed: number) {
    let bigSpeed, smallSpeed, r: number;
    bigSpeed = leftSpeed > rightSpeed ? leftSpeed : rightSpeed;
    smallSpeed = leftSpeed > rightSpeed ? rightSpeed : leftSpeed;

    r = this.botWidth / (bigSpeed / smallSpeed - 1);
    r += this.botWidth / 2;
    return Math.abs(r);
  }

  /**
   * Uses trained regression model to predict motor commands that will produce given Cartesian translation
   * @param {number} changeX
   * @param {number} changeY 
   * @returns {[[leftCmd, rightCmd]]} - change in Cartesian position, given as a 1D array with x and y component of translation
   */
  predictCmd(changeX: number, changeY: number, angle: number): number[][] {
    if (this.regressionModel && changeX && changeY && angle) {
      return this.regressionModel.predict([[changeX, changeY, angle]]);
    } else {
      console.error('Regression model undefined, cannot make prediction!');
    }
  }

  /**
   * Resets stored position to original
   */
  resetBot(angle?: number) {
    // TODO: figure out why the const is not const
    this.CONST_BOT_CENTER = { x: this.CONST_BOT_START.x + (this.botWidth / 2), y: this.CONST_BOT_START.y - (this.botHeight / 2) };
    this.botCenter = this.CONST_BOT_CENTER;
    this.botAngle = angle ? angle : this.CONST_BOT_ANGLE;
    if (angle) {
      console.log('SERVICE RESET: custom angle = ' + angle);
    }
    console.log('SERVICE RESET: botAngle reset to ' + this.botAngle);
  }
}
