
import { Injectable } from '@angular/core';
import MLR from 'ml-regression-multivariate-linear';

@Injectable()
export class MlService {

  // simulated constants
  public wheelRadius: number = (50 / Math.PI); // ~1.6, circumference 10
  public botStart: { x: number, y: number } = { x: 250, y: 250 };  
  public botWidth: number = 50 // width between wheels in px
  public timeUnit: number = 1 // number of seconds wheel rotation takes to complete 

  // service properties
  private regressionModel;
  private inputPositionChanges: number[][] = [];
  private outputCommands: number[][] = [];

  constructor() { }

  /** train ML model with user-given commands */
  train(leftCmd, rightCmd, pos, newPos) {
    let translation: number[] = this.getPosChange(leftCmd, rightCmd);
    if (!(translation && translation[0] && translation[2])) {
      console.error('Translation calc given commands failed!')
    } else {
      this.record(leftCmd, rightCmd, translation[0], translation[1]);

      // train the model on training data
      this.regressionModel = new MLR(this.inputPositionChanges, this.outputCommands);
      console.log(this.regressionModel);
      console.log('Prediction with pos change [12,19] is ' + this.regressionModel.predict([[12, 19]]).toString());
    }
  }

  /** record command and result of executing it as ML training data */
  record(leftCmd, rightCmd, xChange, yChange) {
    // plot left + right command, pos change X + Y as one point in ML training data
    this.inputPositionChanges.push([leftCmd, rightCmd]);
    this.outputCommands.push([xChange, yChange]);
  }

  /**
   * Calculates Cartesian translation of bot given left and right motor speed
   * @param {number} leftSpeed
   * @param {number} rightSpeed 
   * @returns {[x, y]} - change in Cartesian position, given as a 1D array with x and y component of translation
   */
  getPosChange(leftSpeed: number, rightSpeed: number) {
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
    console.log('Left speed = ' + leftSpeed + ', rightSpeed = ' + rightSpeed + ', xChange = ' + xChange + ', yChange = ' + yChange);
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
    return r;
  }
}
